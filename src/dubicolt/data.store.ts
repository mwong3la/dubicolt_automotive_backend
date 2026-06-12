import bcrypt from 'bcrypt';
import { Op, type Transaction, type WhereOptions } from 'sequelize';
import { AppError } from '../errors/AppError';
import { db } from '../database/db';
import { User } from '../database/models/User';
import { Product } from '../database/models/Product';
import { CartItem } from '../database/models/CartItem';
import { Vehicle } from '../database/models/Vehicle';
import { InventoryRecord } from '../database/models/InventoryRecord';
import { Order } from '../database/models/Order';
import { OrderItem } from '../database/models/OrderItem';
import { Payment } from '../database/models/Payment';
import { PartRequest } from '../database/models/PartRequest';
import { Quotation } from '../database/models/Quotation';
import { Supplier } from '../database/models/Supplier';
import { Delivery } from '../database/models/Delivery';
import { Category } from '../database/models/Category';
import { Promotion } from '../database/models/Promotion';
import { ReturnRequest } from '../database/models/ReturnRequest';
import { seedDubicoltCatalog } from '../database/seed-runner';
import type { DubicoltUser, ProductPayload } from './types';
import { orderIdWhere, partRequestIdWhere } from './id-lookup';
import { buildVehicleCatalog, vehicleMatchesFitment } from '../lib/vehicle-catalog';
import { initiateStkPush, isLiveMpesaEnabled } from '../services/mpesa.service';
import {
  notifyOrderPlaced,
  notifyOrderStatusUpdated,
  notifyPartRequestSubmitted,
  notifyPaymentCompleted,
  notifyQuotationCreated,
  notifyQuotationAccepted,
  notifyQuotationRejected,
  notifyDeliveryUpdated,
} from '../notifications/email.notifications';

const LOW_STOCK_THRESHOLD = 10;

function productSellingPrice(p: Product): number {
  if (p.price_kes != null && Number(p.price_kes) > 0) return Math.round(Number(p.price_kes));
  return Math.round(Number(p.price_usd) * 130);
}

function toPublicUser(u: User): { id: string; email: string; name: string; role: string } {
  return { id: u.id, email: u.email, name: u.name, role: u.role };
}

function toDomainUser(u: User): DubicoltUser {
  return {
    id: u.id,
    email: u.email,
    passwordHash: u.password,
    name: u.name,
    role: u.role as DubicoltUser['role'],
  };
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}


function productImages(p: Product): string[] {
  const list = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
  if (list.length > 0) return list;
  return p.image_url ? [p.image_url] : [];
}

function productToDto(p: Product, qty?: number) {
  const images = productImages(p);
  return {
    id: p.id,
    title: p.name,
    sku: p.sku,
    description: p.description ?? '',
    category: p.category,
    brand: p.brand ?? p.vendor ?? '',
    oemNumber: p.oem_number ?? '',
    sellingPrice: productSellingPrice(p),
    imageUrl: images[0] ?? p.image_url,
    images,
    origin: p.origin ?? 'KE',
    status: p.status,
    compatibleVehicles: p.compatible_vehicles ?? [],
    stock: qty ?? p.stock,
  };
}

function nextOrderNumber(): string {
  return `ORD${Date.now().toString().slice(-6)}`;
}

function nextRequestNumber(): string {
  return `REQ${Date.now().toString().slice(-6)}`;
}

function nextReturnNumber(): string {
  return `RET${Date.now().toString().slice(-6)}`;
}

async function getOrCreateInventory(productId: string, transaction?: Transaction): Promise<InventoryRecord> {
  let record = await InventoryRecord.findOne({ where: { product_id: productId }, transaction });
  if (!record) {
    const product = await Product.findByPk(productId, { transaction });
    const qty = Math.max(0, Number(product?.stock) || 0);
    record = await InventoryRecord.create({ product_id: productId, quantity: qty }, { transaction });
  }
  return record;
}

async function syncProductStock(productId: string, quantity: number, transaction?: Transaction) {
  const product = await Product.findByPk(productId, { transaction });
  if (product) {
    await product.update(
      { stock: quantity, low_stock: quantity > 0 && quantity < LOW_STOCK_THRESHOLD },
      { transaction },
    );
  }
}

export class DataStore {
  async init(): Promise<void> {
    await seedDubicoltCatalog();
    await this.syncInventoryFromProducts();
    await this.syncCategoriesFromProducts();
  }

  private async syncInventoryFromProducts() {
    const products = await Product.findAll();
    for (const p of products) {
      const existing = await InventoryRecord.findOne({ where: { product_id: p.id } });
      if (!existing) {
        await InventoryRecord.create({
          product_id: p.id,
          quantity: Math.max(0, Number(p.stock) || 0),
        });
      }
    }
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  async findUserByEmail(email: string): Promise<DubicoltUser | undefined> {
    const u = await User.findOne({ where: { email: { [Op.iLike]: email } } });
    if (!u || !u.is_active) return undefined;
    return toDomainUser(u);
  }

  async findUserRowByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email: { [Op.iLike]: email } } });
  }

  async getUser(id: string): Promise<DubicoltUser | undefined> {
    const u = await User.findByPk(id);
    if (!u || !u.is_active) return undefined;
    return toDomainUser(u);
  }

  async getUserById(id: string): Promise<User | null> {
    return User.findByPk(id);
  }

  async createUser(data: { email: string; password: string; name: string }): Promise<DubicoltUser> {
    const row = await User.create({
      email: data.email,
      password: await bcrypt.hash(data.password, 10),
      name: data.name.trim(),
      company: '',
      role: 'buyer',
      is_active: true,
    });
    return toDomainUser(row);
  }

  async listUsers(query?: {
    search?: string;
    role?: DubicoltUser['role'];
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, query?.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query?.pageSize ?? 20));
    const searchTerm = query?.search?.trim();
    const where: WhereOptions = {
      ...(query?.role ? { role: query.role } : {}),
      ...(searchTerm
        ? {
            [Op.or]: [
              { name: { [Op.iLike]: `%${searchTerm}%` } },
              { email: { [Op.iLike]: `%${searchTerm}%` } },
            ],
          }
        : {}),
    };
    const { rows, count } = await User.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    return {
      data: rows.map((row) => this.toAdminUser(row)),
      meta: { page, page_size: pageSize, total: count },
    };
  }

  async createUserAdmin(data: {
    name: string;
    email: string;
    password: string;
    role?: DubicoltUser['role'];
  }) {
    const existing = await User.findOne({ where: { email: { [Op.iLike]: data.email.trim() } } });
    if (existing) {
      throw new AppError(400, 'email_exists', 'Account already exists with this email');
    }
    const row = await User.create({
      email: data.email.trim(),
      password: await bcrypt.hash(data.password, 10),
      name: data.name.trim(),
      company: '',
      role: data.role ?? 'buyer',
      is_active: true,
    });
    return this.toAdminUser(row);
  }

  async updateUser(
    id: string,
    data: Partial<{
      name: string;
      email: string;
      role: DubicoltUser['role'];
      is_active: boolean;
      password: string;
    }>,
  ) {
    const row = await User.findByPk(id);
    if (!row) return null;

    if (data.email !== undefined) {
      const email = data.email.trim();
      const existing = await User.findOne({ where: { email: { [Op.iLike]: email } } });
      if (existing && existing.id !== id) {
        throw new AppError(400, 'email_exists', 'Account already exists with this email');
      }
      row.email = email;
    }
    if (data.name !== undefined) row.name = data.name.trim();
    if (data.role !== undefined) row.role = data.role;
    if (data.is_active !== undefined) row.is_active = data.is_active;
    if (data.password) row.password = await bcrypt.hash(data.password, 10);

    await row.save();
    return this.toAdminUser(row);
  }

  async updateUserProfile(userId: string, data: Partial<{ name: string }>) {
    const row = await User.findByPk(userId);
    if (!row || !row.is_active) return null;
    if (data.name !== undefined) row.name = data.name.trim();
    await row.save();
    return this.toPublicUser(toDomainUser(row));
  }

  async changeUserPassword(userId: string, currentPassword: string, newPassword: string) {
    const row = await User.findByPk(userId);
    if (!row || !row.is_active) return false;
    if (!(await bcrypt.compare(currentPassword, row.password))) {
      throw new AppError(401, 'invalid_credentials', 'Current password is incorrect');
    }
    row.password = await bcrypt.hash(newPassword, 10);
    await row.save();
    return true;
  }

  toPublicUser(u: DubicoltUser) {
    return { id: u.id, email: u.email, name: u.name, role: u.role };
  }

  toAdminUser(u: User) {
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      is_active: u.is_active,
      created_at: u.createdAt?.toISOString() ?? null,
    };
  }

  // ── Vehicles ────────────────────────────────────────────────────────────

  async createVehicle(userId: string, data: { make: string; model: string; year: number; engine?: string }) {
    const row = await Vehicle.create({ user_id: userId, ...data });
    return this.vehicleToDto(row);
  }

  async listVehicles(userId: string) {
    const rows = await Vehicle.findAll({ where: { user_id: userId }, order: [['created_at', 'DESC']] });
    return rows.map((v) => this.vehicleToDto(v));
  }

  async updateVehicle(userId: string, id: string, data: Partial<{ make: string; model: string; year: number; engine?: string }>) {
    const row = await Vehicle.findOne({ where: { id, user_id: userId } });
    if (!row) return null;
    await row.update(data);
    return this.vehicleToDto(row);
  }

  async deleteVehicle(userId: string, id: string) {
    const deleted = await Vehicle.destroy({ where: { id, user_id: userId } });
    return deleted > 0;
  }

  async getVehicle(userId: string, id: string) {
    const row = await Vehicle.findOne({ where: { id, user_id: userId } });
    if (!row) return null;
    return this.vehicleToDto(row);
  }

  async getVehicleCatalog() {
    const rows = await Product.findAll({
      where: { status: 'published' },
      attributes: ['compatible_vehicles'],
    });
    const vehicles = rows.flatMap((row) => row.compatible_vehicles ?? []);
    return buildVehicleCatalog(vehicles);
  }

  private vehicleToDto(v: Vehicle) {
    return { id: v.id, make: v.make, model: v.model, year: v.year, engine: v.engine };
  }

  // ── Products ────────────────────────────────────────────────────────────

  async createProduct(data: ProductPayload) {
    const images =
      data.images?.filter(Boolean).length ? data.images!.filter(Boolean) : [data.imageUrl];
    const row = await Product.create({
      sku: data.sku,
      name: data.title,
      description: data.description,
      category: data.category,
      brand: data.brand,
      oem_number: data.oemNumber,
      compatible_vehicles: data.compatibleVehicles ?? [],
      price_kes: data.sellingPrice,
      price_usd: data.sellingPrice / 130,
      image_url: images[0],
      images,
      origin: 'KE',
      specs: {},
      stock: 0,
      status: 'published',
      on_marketplace: true,
      marketplace_cta: 'cart',
      vendor: data.brand,
    });
    await InventoryRecord.create({ product_id: row.id, quantity: 0 });
    return productToDto(row, 0);
  }

  async listProducts() {
    const rows = await Product.findAll({ order: [['name', 'ASC']] });
    const result = [];
    for (const p of rows) {
      const inv = await InventoryRecord.findOne({ where: { product_id: p.id } });
      result.push(productToDto(p, inv?.quantity ?? p.stock));
    }
    return result;
  }

  async getProduct(id: string) {
    const p = await Product.findByPk(id);
    if (!p) return null;
    const inv = await InventoryRecord.findOne({ where: { product_id: p.id } });
    return productToDto(p, inv?.quantity ?? p.stock);
  }

  async updateProduct(id: string, data: Partial<ProductPayload>) {
    const row = await Product.findByPk(id);
    if (!row) return null;
    const updates: Record<string, unknown> = {};
    if (data.title !== undefined) updates.name = data.title;
    if (data.sku !== undefined) updates.sku = data.sku;
    if (data.description !== undefined) updates.description = data.description;
    if (data.category !== undefined) updates.category = data.category;
    if (data.brand !== undefined) {
      updates.brand = data.brand;
      updates.vendor = data.brand;
    }
    if (data.oemNumber !== undefined) updates.oem_number = data.oemNumber;
    if (data.sellingPrice !== undefined) {
      updates.price_kes = data.sellingPrice;
      updates.price_usd = data.sellingPrice / 130;
    }
    if (data.images !== undefined) {
      const images = data.images.filter(Boolean);
      updates.images = images;
      if (images[0]) updates.image_url = images[0];
    } else if (data.imageUrl !== undefined) {
      updates.image_url = data.imageUrl;
      updates.images = [data.imageUrl];
    }
    if (data.compatibleVehicles !== undefined) updates.compatible_vehicles = data.compatibleVehicles;
    await row.update(updates);
    const inv = await InventoryRecord.findOne({ where: { product_id: row.id } });
    return productToDto(row, inv?.quantity ?? row.stock);
  }

  async searchProducts(filters: {
    keyword?: string;
    make?: string;
    model?: string;
    year?: number;
    engine?: string;
    vehicleId?: string;
    userId?: string;
    category?: string;
    brand?: string;
  }) {
    let make = filters.make;
    let model = filters.model;
    let year = filters.year;
    let engine = filters.engine;

    if (filters.vehicleId) {
      if (!filters.userId) {
        throw new AppError(401, 'unauthorized', 'Authentication required to search by saved vehicle');
      }
      const savedVehicle = await Vehicle.findOne({
        where: { id: filters.vehicleId, user_id: filters.userId },
      });
      if (!savedVehicle) {
        throw new AppError(404, 'not_found', 'Saved vehicle not found');
      }
      make = savedVehicle.make;
      model = savedVehicle.model;
      year = savedVehicle.year;
      if (!engine && savedVehicle.engine) engine = savedVehicle.engine;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { status: 'published' };
    if (filters.category) where.category = { [Op.iLike]: filters.category };
    if (filters.brand) where.brand = { [Op.iLike]: filters.brand };
    if (filters.keyword) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${filters.keyword}%` } },
        { sku: { [Op.iLike]: `%${filters.keyword}%` } },
        { oem_number: { [Op.iLike]: `%${filters.keyword}%` } },
        { description: { [Op.iLike]: `%${filters.keyword}%` } },
      ];
    }

    let rows = await Product.findAll({ where, order: [['name', 'ASC']] });

    if (make || model || year || engine) {
      rows = rows.filter((product) =>
        vehicleMatchesFitment(product.compatible_vehicles ?? [], { make, model, year, engine }),
      );
    }

    const result = [];
    for (const p of rows) {
      const inv = await InventoryRecord.findOne({ where: { product_id: p.id } });
      result.push(productToDto(p, inv?.quantity ?? p.stock));
    }
    return result;
  }

  // ── Inventory ───────────────────────────────────────────────────────────

  async stockIn(productId: string, quantity: number) {
    const product = await Product.findByPk(productId);
    if (!product) throw new AppError(404, 'not_found', 'Product not found');
    const inv = await getOrCreateInventory(productId);
    const newQty = inv.quantity + quantity;
    await inv.update({ quantity: newQty });
    await syncProductStock(productId, newQty);
    return { productId, quantity: newQty };
  }

  async stockOut(productId: string, quantity: number) {
    const product = await Product.findByPk(productId);
    if (!product) throw new AppError(404, 'not_found', 'Product not found');
    const inv = await getOrCreateInventory(productId);
    if (inv.quantity < quantity) {
      throw new AppError(400, 'insufficient_stock', `Only ${inv.quantity} units available`);
    }
    const newQty = inv.quantity - quantity;
    await inv.update({ quantity: newQty });
    await syncProductStock(productId, newQty);
    return { productId, quantity: newQty };
  }

  async listInventory() {
    const records = await InventoryRecord.findAll({
      include: [Product],
      order: [['updated_at', 'DESC']],
    });
    return records.map((r) => {
      const p = r.product;
      return {
        productId: r.product_id,
        title: p?.name ?? '',
        sku: p?.sku ?? '',
        quantity: r.quantity,
        lowStock: r.quantity > 0 && r.quantity < LOW_STOCK_THRESHOLD,
        category: p?.category ?? '',
        origin: p?.origin ?? 'KE',
        imageUrl: p?.image_url ?? '',
        sellingPrice: p ? productSellingPrice(p) : 0,
        status: p?.status ?? 'draft',
      };
    });
  }

  // ── Cart ──────────────────────────────────────────────────────────────────

  async getCart(userId: string) {
    const rows = await CartItem.findAll({ where: { user_id: userId }, include: [Product] });
    const items = rows.map((r) => ({
      id: r.id,
      productId: r.product_id,
      title: r.product?.name ?? '',
      sku: r.product?.sku ?? '',
      quantity: r.quantity,
      unitPrice: r.product ? productSellingPrice(r.product) : 0,
      imageUrl: r.product?.image_url ?? '',
    }));
    const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    return { items, total };
  }

  async addCartItem(userId: string, productId: string, quantity: number) {
    const product = await Product.findByPk(productId);
    if (!product) throw new AppError(404, 'not_found', 'Product not found');
    const existing = await CartItem.findOne({ where: { user_id: userId, product_id: productId } });
    if (existing) {
      await existing.update({ quantity: existing.quantity + quantity });
    } else {
      await CartItem.create({ user_id: userId, product_id: productId, quantity });
    }
    return this.getCart(userId);
  }

  async updateCartItem(userId: string, itemId: string, quantity: number) {
    const row = await CartItem.findOne({ where: { id: itemId, user_id: userId } });
    if (!row) throw new AppError(404, 'not_found', 'Cart item not found');
    if (quantity <= 0) await row.destroy();
    else await row.update({ quantity });
    return this.getCart(userId);
  }

  async removeCartItem(userId: string, itemId: string) {
    await CartItem.destroy({ where: { id: itemId, user_id: userId } });
    return this.getCart(userId);
  }

  // ── Checkout ──────────────────────────────────────────────────────────────

  async checkout(
    userId: string,
    data: { deliveryMethod: string; deliveryAddress: string; promoCode?: string },
  ) {
    const cartRows = await CartItem.findAll({ where: { user_id: userId }, include: [Product] });
    if (cartRows.length === 0) throw new AppError(400, 'empty_cart', 'Cart is empty');

    return db.transaction(async (transaction) => {
      let total = 0;
      const lineItems: { product: Product; quantity: number; unitPrice: number }[] = [];

      for (const row of cartRows) {
        const product = row.product;
        if (!product) continue;
        const inv = await getOrCreateInventory(product.id, transaction);
        if (inv.quantity < row.quantity) {
          throw new AppError(400, 'insufficient_stock', `Not enough stock for "${product.name}"`);
        }
        const unitPrice = productSellingPrice(product);
        total += unitPrice * row.quantity;
        lineItems.push({ product, quantity: row.quantity, unitPrice });
      }

      const { discount, code: promotionCode } = await this.resolvePromotion(data.promoCode, total);
      const orderTotal = Math.max(0, total - discount);

      const orderNumber = nextOrderNumber();
      const order = await Order.create(
        {
          order_number: orderNumber,
          user_id: userId,
          status: 'PENDING_PAYMENT',
          total: orderTotal,
          delivery_method: data.deliveryMethod,
          delivery_address: data.deliveryAddress,
          promotion_code: promotionCode,
          discount_amount: discount,
        },
        { transaction },
      );

      for (const item of lineItems) {
        await OrderItem.create(
          {
            order_id: order.id,
            product_id: item.product.id,
            title: item.product.name,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            image_url: item.product.image_url,
          },
          { transaction },
        );
        const inv = await getOrCreateInventory(item.product.id, transaction);
        const newQty = inv.quantity - item.quantity;
        await inv.update({ quantity: newQty }, { transaction });
        await syncProductStock(item.product.id, newQty, transaction);
      }

      await CartItem.destroy({ where: { user_id: userId }, transaction });

      return { orderId: order.order_number, amount: orderTotal, userId };
    }).then((result) => {
      void notifyOrderPlaced(result.orderId, result.userId);
      return { orderId: result.orderId, amount: result.amount };
    });
  }

  // ── Orders ────────────────────────────────────────────────────────────────

  async listOrders(userId?: string) {
    const where = userId ? { user_id: userId } : {};
    const rows = await Order.findAll({
      where,
      include: [
        { model: User, attributes: ['name', 'email'] },
        { model: OrderItem, include: [Product] },
        Delivery,
      ],
      order: [['created_at', 'DESC']],
    });
    return rows.map((o) => this.orderSummaryToDto(o));
  }

  async getOrder(userId: string | undefined, orderId: string) {
    const where = {
      ...orderIdWhere(orderId),
      ...(userId ? { user_id: userId } : {}),
    };
    const order = await Order.findOne({
      where: where as never,
      include: [
        { model: User, attributes: ['name', 'email'] },
        { model: OrderItem, include: [Product] },
        Delivery,
      ],
    });
    if (!order) return null;
    return this.orderDetailToDto(order);
  }

  async updateOrderStatus(orderId: string, status: string, paymentNote?: string) {
    const allowed = [
      'PENDING_PAYMENT',
      'PAID',
      'PROCESSING',
      'DISPATCHED',
      'IN_TRANSIT',
      'DELIVERED',
      'CANCELLED',
    ];
    const normalized = status.toUpperCase().replace(/\s+/g, '_');
    if (!allowed.includes(normalized)) {
      throw new AppError(400, 'invalid_status', 'Invalid order status');
    }
    const order = await Order.findOne({
      where: orderIdWhere(orderId) as never,
      include: [Delivery, { model: OrderItem, include: [Product] }, User],
    });
    if (!order) return null;
    const previousStatus = order.status;
    await order.update({ status: normalized as Order['status'] });

    if (normalized === 'PAID' && previousStatus !== 'PAID') {
      const completed = await Payment.findOne({
        where: { order_id: order.id, status: 'COMPLETED' },
      });
      if (!completed) {
        await Payment.create({
          order_id: order.id,
          method: 'external',
          amount: order.total,
          phone: '',
          status: 'COMPLETED',
          mpesa_receipt_number: paymentNote?.trim() || `EXT${Date.now()}`,
        });
      }
      const existingDelivery = order.deliveries?.[0] ?? (await Delivery.findOne({ where: { order_id: order.id } }));
      if (!existingDelivery) {
        await Delivery.create({ order_id: order.id, status: 'PROCESSING' });
      }
      void notifyPaymentCompleted(order.order_number);
    }

    const delivery = order.deliveries?.[0] ?? (await Delivery.findOne({ where: { order_id: order.id } }));
    if (delivery && normalized !== 'PAID') {
      const deliveryStatus =
        normalized === 'DELIVERED'
          ? 'DELIVERED'
          : normalized === 'IN_TRANSIT'
            ? 'IN_TRANSIT'
            : normalized === 'DISPATCHED'
              ? 'DISPATCHED'
              : 'PROCESSING';
      await delivery.update({ status: deliveryStatus as Delivery['status'] });
    }

    if (normalized !== 'PAID') {
      void notifyOrderStatusUpdated(orderId, normalized);
    }

    return this.orderDetailToDto(order);
  }

  private orderSummaryToDto(o: Order) {
    const firstItem = o.items?.[0];
    const delivery = o.deliveries?.[0];
    return {
      id: o.order_number,
      status: o.status,
      total: o.total,
      createdAt: o.createdAt,
      customerName: o.user?.name,
      customerEmail: o.user?.email,
      itemTitle: firstItem?.title,
      itemImageUrl: firstItem?.product?.image_url ?? firstItem?.image_url,
      deliveryId: delivery?.id,
      deliveryStatus: delivery?.status,
    };
  }

  private orderDetailToDto(order: Order) {
    return {
      id: order.order_number,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt,
      customerName: order.user?.name,
      customerEmail: order.user?.email,
      deliveryMethod: order.delivery_method,
      deliveryAddress: order.delivery_address,
      items: (order.items ?? []).map((i) => ({
        title: i.title,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        imageUrl: i.product?.image_url ?? i.image_url,
        productId: i.product_id,
      })),
      deliveries: (order.deliveries ?? []).map((d) => ({
        id: d.id,
        status: d.status,
        notes: d.notes,
        proofUrl: d.proof_url,
      })),
    };
  }

  // ── Payments (M-Pesa) ─────────────────────────────────────────────────────

  async initiateMpesaStkPush(orderId: string, phone: string) {
    const order = await Order.findOne({
      where: orderIdWhere(orderId) as never,
    });
    if (!order) throw new AppError(404, 'not_found', 'Order not found');
    if (order.status === 'PAID') throw new AppError(400, 'already_paid', 'Order already paid');

    const normalizedPhone = phone.replace(/\D/g, '').replace(/^0/, '254');
    let checkoutRequestId = `CHK${Date.now()}`;

    const payment = await Payment.create({
      order_id: order.id,
      method: 'mpesa',
      amount: order.total,
      phone: normalizedPhone,
      status: 'PENDING',
      mpesa_checkout_request_id: checkoutRequestId,
    });

    const useSandbox = !isLiveMpesaEnabled();
    if (useSandbox) {
      await this.completePayment(payment.id, { receiptNumber: `MPESA${Date.now()}` });
    } else {
      const stk = await initiateStkPush({
        phone: normalizedPhone,
        amount: order.total,
        accountReference: order.order_number,
        transactionDesc: 'Dubicolt order',
      });
      checkoutRequestId = stk.checkoutRequestId;
      await payment.update({ mpesa_checkout_request_id: checkoutRequestId });
    }

    return {
      checkoutRequestId,
      orderId: order.order_number,
      amount: order.total,
      phone: normalizedPhone,
      message: useSandbox
        ? 'M-Pesa sandbox: payment auto-completed (set MPESA_* env vars for live STK push)'
        : 'STK push sent — enter your M-Pesa PIN on your phone',
    };
  }

  async handleMpesaCallback(payload: Record<string, unknown>) {
    const checkoutId = String(
      (payload as { Body?: { stkCallback?: { CheckoutRequestID?: string } } }).Body?.stkCallback
        ?.CheckoutRequestID ?? payload.checkoutRequestId ?? '',
    );
    if (!checkoutId) return { ResultCode: 1, ResultDesc: 'Missing checkout request ID' };

    const payment = await Payment.findOne({ where: { mpesa_checkout_request_id: checkoutId } });
    if (!payment) return { ResultCode: 1, ResultDesc: 'Payment not found' };

    const resultCode = Number(
      (payload as { Body?: { stkCallback?: { ResultCode?: number } } }).Body?.stkCallback?.ResultCode ?? 0,
    );
    if (resultCode === 0) {
      const receipt =
        (payload as { Body?: { stkCallback?: { CallbackMetadata?: { Item?: { Name: string; Value: string }[] } } } })
          .Body?.stkCallback?.CallbackMetadata?.Item?.find((i) => i.Name === 'MpesaReceiptNumber')?.Value ??
        `MPESA${Date.now()}`;
      await this.completePayment(payment.id, { receiptNumber: String(receipt), payload });
    } else {
      await payment.update({ status: 'FAILED', callback_payload: payload });
    }

    return { ResultCode: 0, ResultDesc: 'Accepted' };
  }

  async listPayments(userId?: string) {
    const rows = await Payment.findAll({
      include: [
        {
          model: Order,
          required: true,
          ...(userId ? { where: { user_id: userId } } : {}),
          include: userId ? [] : [{ model: User, attributes: ['name', 'email'] }],
        },
      ],
      order: [['created_at', 'DESC']],
    });
    return rows.map((p) => this.paymentToDto(p, !userId));
  }

  async getPaymentsForOrder(orderId: string, userId?: string) {
    const order = await Order.findOne({
      where: orderIdWhere(orderId) as never,
      include: userId ? [] : [{ model: User, attributes: ['name', 'email'] }],
    });
    if (!order) return null;
    if (userId && order.user_id !== userId) return null;
    const rows = await Payment.findAll({
      where: { order_id: order.id },
      order: [['created_at', 'DESC']],
    });
    return rows.map((p) => {
      (p as Payment & { order?: Order }).order = order;
      return this.paymentToDto(p, !userId);
    });
  }

  private paymentToDto(p: Payment, includeCustomer = false) {
    const order = p.order;
    return {
      id: p.id,
      orderId: order?.order_number ?? '',
      orderNumber: order?.order_number ?? '',
      method: p.method,
      amount: p.amount,
      phone: p.phone,
      status: p.status,
      mpesaReceiptNumber: p.mpesa_receipt_number,
      mpesaCheckoutRequestId: p.mpesa_checkout_request_id,
      createdAt: p.createdAt,
      customerName: includeCustomer ? order?.user?.name : undefined,
      customerEmail: includeCustomer ? order?.user?.email : undefined,
    };
  }

  private async completePayment(
    paymentId: string,
    data: { receiptNumber: string; payload?: Record<string, unknown> },
  ) {
    const payment = await Payment.findByPk(paymentId, { include: [Order] });
    if (!payment) return;
    await payment.update({
      status: 'COMPLETED',
      mpesa_receipt_number: data.receiptNumber,
      callback_payload: data.payload,
    });
    if (payment.order) {
      await payment.order.update({ status: 'PAID' });
      const existing = await Delivery.findOne({ where: { order_id: payment.order.id } });
      if (!existing) {
        await Delivery.create({ order_id: payment.order.id, status: 'PROCESSING' });
      }
      void notifyPaymentCompleted(payment.order.order_number);
    }
  }

  // ── Part Requests ─────────────────────────────────────────────────────────

  async createPartRequest(
    userId: string,
    data: {
      vehicle: { make: string; model: string; year: number };
      partName: string;
      description: string;
      photoUrls?: string[];
      urgency?: 'standard' | 'express';
    },
  ) {
    const row = await PartRequest.create({
      user_id: userId,
      request_number: nextRequestNumber(),
      vehicle: data.vehicle,
      part_name: data.partName,
      description: data.description,
      photo_urls: data.photoUrls ?? [],
      urgency: data.urgency ?? 'standard',
      status: 'SUBMITTED',
    });
    void notifyPartRequestSubmitted(row.request_number, userId);
    return this.partRequestToDto(row);
  }

  async listPartRequests(userId?: string) {
    const where: Record<string, unknown> = userId ? { user_id: userId } : {};
    if (userId) where.status = { [Op.ne]: 'CLOSED' };
    const rows = await PartRequest.findAll({
      where: where as never,
      include: userId
        ? []
        : [
            { model: User, attributes: ['name', 'email'] },
            { model: Quotation, attributes: ['id', 'status', 'price', 'lead_time_days', 'valid_until', 'notes', 'shipping_cost', 'created_at'] },
          ],
      order: [['created_at', 'DESC']],
    });
    return rows.map((r) => ({
      ...this.partRequestToDto(r, !userId),
      quotations: !userId ? (r.quotations ?? []).map((q) => this.quotationToDto(q)) : undefined,
    }));
  }

  async getPartRequest(id: string, userId?: string) {
    const where: Record<string, unknown> = {
      ...partRequestIdWhere(id),
    };
    if (userId) where.user_id = userId;
    const row = await PartRequest.findOne({
      where: where as never,
      include: [Quotation],
    });
    if (!row) return null;

    let linkedOrder: { orderNumber: string; status: string; amount: number } | null = null;
    if (row.status === 'CLOSED') {
      const order = await Order.findOne({
        where: { part_request_id: row.id },
        order: [['created_at', 'DESC']],
      });
      if (order) {
        linkedOrder = {
          orderNumber: order.order_number,
          status: order.status,
          amount: order.total,
        };
      }
    }

    return {
      ...this.partRequestToDto(row),
      quotations: (row.quotations ?? []).map((q) => this.quotationToDto(q)),
      linkedOrder,
    };
  }

  private partRequestToDto(r: PartRequest, includeCustomer = false) {
    return {
      id: r.request_number,
      requestId: r.id,
      vehicle: r.vehicle,
      partName: r.part_name,
      description: r.description,
      photoUrls: r.photo_urls,
      urgency: r.urgency,
      status: r.status,
      createdAt: r.createdAt,
      customerName: includeCustomer ? r.user?.name : undefined,
      customerEmail: includeCustomer ? r.user?.email : undefined,
    };
  }

  // ── Quotations ────────────────────────────────────────────────────────────

  async createQuotation(data: {
    requestId: string;
    price: number;
    leadTimeDays: number;
    validUntil: string;
    notes?: string;
    shippingCost?: number;
    supplierId?: string;
  }) {
    const request = await PartRequest.findOne({
      where: partRequestIdWhere(data.requestId) as never,
      include: [Quotation],
    });
    if (!request) throw new AppError(404, 'not_found', 'Part request not found');

    const payload = {
      price: data.price,
      lead_time_days: data.leadTimeDays,
      valid_until: data.validUntil,
      notes: data.notes?.trim() || '',
      shipping_cost: data.shippingCost ?? 0,
    };

    const pending = (request.quotations ?? []).find((q) => q.status === 'PENDING');
    if (pending) {
      await pending.update(payload);
      await request.update({ status: 'QUOTED' });
      return this.quotationToDto(pending);
    }

    const quote = await Quotation.create({
      request_id: request.id,
      supplier_id: data.supplierId,
      status: 'PENDING',
      ...payload,
    });
    await request.update({ status: 'QUOTED' });
    void notifyQuotationCreated(request.request_number, quote.id);
    return this.quotationToDto(quote);
  }

  async getQuotation(id: string) {
    const quote = await Quotation.findByPk(id, { include: [PartRequest, Supplier] });
    if (!quote) return null;
    return {
      ...this.quotationToDto(quote),
      request: quote.partRequest ? this.partRequestToDto(quote.partRequest) : null,
      supplier: quote.supplier
        ? { id: quote.supplier.id, name: quote.supplier.name, phone: quote.supplier.phone, email: quote.supplier.email }
        : null,
    };
  }

  async acceptQuotation(id: string, userId: string) {
    const quote = await Quotation.findByPk(id, { include: [PartRequest] });
    if (!quote) throw new AppError(404, 'not_found', 'Quotation not found');
    if (quote.partRequest?.user_id !== userId) throw new AppError(403, 'forbidden', 'Not your quotation');
    if (quote.status !== 'PENDING') throw new AppError(400, 'invalid_status', 'Quotation is not pending');

    const partRequest = quote.partRequest;
    const vehicle = partRequest?.vehicle;
    const itemTitle = vehicle
      ? `${partRequest!.part_name} · ${vehicle.make} ${vehicle.model} (${vehicle.year})`
      : partRequest?.part_name ?? 'Requested Part';
    const itemImageUrl = partRequest?.photo_urls?.[0];

    const orderNumber = nextOrderNumber();
    const order = await Order.create({
      order_number: orderNumber,
      user_id: userId,
      status: 'PENDING_PAYMENT',
      total: quote.price,
      part_request_id: quote.request_id,
      quotation_id: quote.id,
    });
    await OrderItem.create({
      order_id: order.id,
      title: itemTitle,
      quantity: 1,
      unit_price: quote.price,
      image_url: itemImageUrl,
    });
    await Delivery.create({ order_id: order.id, status: 'PROCESSING' });
    await quote.update({ status: 'ACCEPTED' });
    if (quote.partRequest) await quote.partRequest.update({ status: 'CLOSED' });

    void notifyQuotationAccepted(order.order_number, userId);

    return { orderId: order.order_number, amount: quote.price };
  }

  async rejectQuotation(id: string, userId: string) {
    const quote = await Quotation.findByPk(id, { include: [PartRequest] });
    if (!quote) throw new AppError(404, 'not_found', 'Quotation not found');
    if (quote.partRequest?.user_id !== userId) throw new AppError(403, 'forbidden', 'Not your quotation');
    if (quote.status !== 'PENDING') throw new AppError(400, 'invalid_status', 'Quotation is not pending');
    await quote.update({ status: 'REJECTED' });
    if (quote.partRequest) {
      await quote.partRequest.update({ status: 'UNDER_REVIEW' });
      void notifyQuotationRejected(quote.partRequest.request_number, quote.id, userId);
    }
    return this.quotationToDto(quote);
  }

  private quotationToDto(q: Quotation) {
    return {
      id: q.id,
      requestId: q.request_id,
      price: q.price,
      shippingCost: Number(q.shipping_cost) || 0,
      leadTimeDays: q.lead_time_days,
      validUntil: q.valid_until,
      notes: q.notes ?? '',
      status: q.status,
      createdAt: q.createdAt,
    };
  }

  // ── Suppliers ─────────────────────────────────────────────────────────────

  async createSupplier(data: { name: string; phone?: string; email?: string }) {
    const row = await Supplier.create(data);
    return this.supplierToDto(row);
  }

  async listSuppliers() {
    const rows = await Supplier.findAll({ order: [['name', 'ASC']] });
    return rows.map((s) => this.supplierToDto(s));
  }

  async updateSupplier(id: string, data: Partial<{ name: string; phone?: string; email?: string }>) {
    const row = await Supplier.findByPk(id);
    if (!row) return null;
    await row.update(data);
    return this.supplierToDto(row);
  }

  private supplierToDto(s: Supplier) {
    return { id: s.id, name: s.name, phone: s.phone, email: s.email };
  }

  // ── Deliveries ────────────────────────────────────────────────────────────

  async createDelivery(data: { orderId: string; notes?: string }) {
    const order = await Order.findOne({
      where: orderIdWhere(data.orderId) as never,
    });
    if (!order) throw new AppError(404, 'not_found', 'Order not found');
    const delivery = await Delivery.create({ order_id: order.id, status: 'PROCESSING', notes: data.notes });
    return this.deliveryToDto(delivery);
  }

  async updateDeliveryStatus(id: string, status: string, proofUrl?: string) {
    const allowed = ['PROCESSING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED'];
    const normalized = status.toUpperCase();
    if (!allowed.includes(normalized)) throw new AppError(400, 'invalid_status', 'Invalid delivery status');
    const delivery = await Delivery.findByPk(id, { include: [Order] });
    if (!delivery) throw new AppError(404, 'not_found', 'Delivery not found');
    await delivery.update({
      status: normalized as Delivery['status'],
      ...(proofUrl ? { proof_url: proofUrl } : {}),
    });
    if (delivery.order) {
      const orderStatus =
        normalized === 'DELIVERED'
          ? 'DELIVERED'
          : normalized === 'IN_TRANSIT'
            ? 'IN_TRANSIT'
            : normalized === 'DISPATCHED'
              ? 'DISPATCHED'
              : 'PROCESSING';
      await delivery.order.update({ status: orderStatus as Order['status'] });
      void notifyDeliveryUpdated(delivery.order.order_number, normalized, proofUrl);
    }
    return this.deliveryToDto(delivery);
  }

  async getDelivery(id: string) {
    const delivery = await Delivery.findByPk(id, { include: [Order] });
    if (!delivery) return null;
    return {
      ...this.deliveryToDto(delivery),
      orderId: delivery.order?.order_number,
    };
  }

  async listDeliveries() {
    const rows = await Delivery.findAll({
      include: [
        {
          model: Order,
          include: [
            { model: User, attributes: ['name', 'email'] },
            { model: OrderItem, include: [Product] },
          ],
        },
      ],
      order: [['updated_at', 'DESC']],
    });
    return rows.map((d) => {
      const firstItem = d.order?.items?.[0];
      return {
        ...this.deliveryToDto(d),
        orderNumber: d.order?.order_number,
        orderStatus: d.order?.status,
        orderTotal: d.order?.total,
        orderType: d.order?.part_request_id ? 'sourcing' : 'marketplace',
        customerName: d.order?.user?.name,
        customerEmail: d.order?.user?.email,
        itemTitle: firstItem?.title,
        itemImageUrl: firstItem?.product?.image_url ?? firstItem?.image_url,
        itemQuantity: firstItem?.quantity ?? 1,
        itemUnitPrice: firstItem?.unit_price,
        deliveryAddress: d.order?.delivery_address,
        deliveryMethod: d.order?.delivery_method,
        items: (d.order?.items ?? []).map((i) => ({
          title: i.title,
          quantity: i.quantity,
          unitPrice: i.unit_price,
          imageUrl: i.product?.image_url ?? i.image_url,
        })),
      };
    });
  }

  private deliveryToDto(d: Delivery) {
    return { id: d.id, orderId: d.order_id, status: d.status, notes: d.notes, proofUrl: d.proof_url };
  }

  async getOrderInvoice(userId: string | undefined, orderId: string) {
    const order = await this.getOrder(userId, orderId);
    if (!order) return null;
    const paid = !['PENDING_PAYMENT', 'CANCELLED'].includes(order.status.toUpperCase());
    return {
      orderNumber: order.id,
      status: order.status,
      paid,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      deliveryMethod: order.deliveryMethod,
      deliveryAddress: order.deliveryAddress,
      createdAt: order.createdAt,
      items: order.items,
      total: order.total,
      currency: 'KES',
    };
  }

  // ── Reports ───────────────────────────────────────────────────────────────

  // ── Categories ──────────────────────────────────────────────────────────

  async syncCategoriesFromProducts() {
    const products = await Product.findAll();
    const names = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    for (const name of names) {
      const slug = slugify(name);
      const exists = await Category.findOne({ where: { [Op.or]: [{ name }, { slug }] } });
      if (!exists) {
        const sample = products.find((p) => p.category === name);
        await Category.create({
          name,
          slug,
          description: '',
          image_url: sample?.image_url ?? '',
          status: 'published',
          origins: ['KE'],
        });
      }
    }
  }

  private async categoryToDto(cat: Category) {
    const productCount = await Product.count({ where: { category: cat.name } });
    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      imageUrl: cat.image_url,
      status: cat.status,
      origins: cat.origins ?? ['KE'],
      productCount,
    };
  }

  async listCategories() {
    const rows = await Category.findAll({ order: [['name', 'ASC']] });
    const result = [];
    for (const cat of rows) {
      result.push(await this.categoryToDto(cat));
    }
    return result;
  }

  async getCategory(id: string) {
    const cat = await Category.findOne({
      where: { [Op.or]: [{ id }, { slug: id }] } as never,
    });
    if (!cat) return null;
    return this.categoryToDto(cat);
  }

  async createCategory(data: {
    name: string;
    description?: string;
    imageUrl?: string;
    status?: 'draft' | 'published';
    origins?: string[];
  }) {
    const name = data.name.trim();
    if (!name) throw new AppError(400, 'validation_error', 'Category name is required');
    const slug = slugify(name);
    const existing = await Category.findOne({ where: { [Op.or]: [{ name }, { slug }] } });
    if (existing) throw new AppError(409, 'duplicate', 'Category already exists');
    const row = await Category.create({
      name,
      slug,
      description: data.description?.trim() ?? '',
      image_url: data.imageUrl ?? '',
      status: data.status ?? 'published',
      origins: data.origins?.length ? data.origins : ['KE'],
    });
    return this.categoryToDto(row);
  }

  async updateCategory(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      imageUrl: string;
      status: 'draft' | 'published';
      origins: string[];
    }>,
  ) {
    const row = await Category.findOne({
      where: { [Op.or]: [{ id }, { slug: id }] } as never,
    });
    if (!row) return null;

    const updates: Record<string, unknown> = {};
    if (data.name !== undefined) {
      const name = data.name.trim();
      updates.name = name;
      updates.slug = slugify(name);
    }
    if (data.description !== undefined) updates.description = data.description;
    if (data.imageUrl !== undefined) updates.image_url = data.imageUrl;
    if (data.status !== undefined) updates.status = data.status;
    if (data.origins !== undefined) updates.origins = data.origins;

    const oldName = row.name;
    await row.update(updates);
    if (data.name && data.name !== oldName) {
      await Product.update({ category: row.name }, { where: { category: oldName } });
    }
    return this.categoryToDto(row);
  }

  async deleteCategory(id: string) {
    const row = await Category.findOne({
      where: { [Op.or]: [{ id }, { slug: id }] } as never,
    });
    if (!row) return false;
    const inUse = await Product.count({ where: { category: row.name } });
    if (inUse > 0) {
      throw new AppError(400, 'category_in_use', 'Cannot delete a category that still has products');
    }
    await row.destroy();
    return true;
  }

  // ── Reports ───────────────────────────────────────────────────────────────

  async getAnalytics() {
    const paidStatuses = ['PAID', 'PROCESSING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED'];
    const orders = await Order.findAll({
      where: { status: { [Op.in]: paidStatuses } },
      include: [{ model: OrderItem, include: [Product] }],
      order: [['created_at', 'ASC']],
    });

    const startOfDay = (d: Date) => {
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      return x;
    };
    const formatWeekLabel = (start: Date, endExclusive: Date) => {
      const endDisplay = new Date(endExclusive);
      endDisplay.setDate(endDisplay.getDate() - 1);
      const month = (d: Date) => d.toLocaleDateString('en-KE', { month: 'short' });
      if (start.getMonth() === endDisplay.getMonth() && start.getFullYear() === endDisplay.getFullYear()) {
        return `${start.getDate()}–${endDisplay.getDate()} ${month(start)}`;
      }
      const day = (d: Date) =>
        d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
      return `${day(start)} – ${day(endDisplay)}`;
    };

    const today = startOfDay(new Date());
    const weeks: { week: string; revenue: number; orders: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date(today);
      start.setDate(start.getDate() - (i + 1) * 7);
      const end = new Date(today);
      end.setDate(end.getDate() - i * 7);
      const label = formatWeekLabel(start, end);
      const inWeek = orders.filter((o) => {
        const d = startOfDay(new Date(o.createdAt));
        return d >= start && d < end;
      });
      weeks.push({
        week: label,
        revenue: inWeek.reduce((s, o) => s + o.total, 0),
        orders: inWeek.length,
      });
    }

    const categoryTotals = new Map<string, number>();
    for (const order of orders) {
      for (const item of order.items ?? []) {
        const cat = item.product?.category ?? 'Other';
        categoryTotals.set(cat, (categoryTotals.get(cat) ?? 0) + item.unit_price * item.quantity);
      }
    }
    const sorted = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1]);
    const max = sorted[0]?.[1] ?? 1;
    const topCategories = sorted.slice(0, 6).map(([name, value]) => ({
      name,
      value,
      pct: Math.round((value / max) * 100),
    }));

    return { weeklySales: weeks, topCategories };
  }

  async getDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const paidStatuses = ['PAID', 'PROCESSING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED'];
    const twentyEightDaysAgo = new Date(today);
    twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);

    const ordersToday = await Order.findAll({
      where: { createdAt: { [Op.gte]: today }, status: { [Op.ne]: 'CANCELLED' } },
    });
    const salesToday = ordersToday
      .filter((o) => paidStatuses.includes(o.status))
      .reduce((s, o) => s + o.total, 0);

    const ordersLast28Days = await Order.findAll({
      where: {
        createdAt: { [Op.gte]: twentyEightDaysAgo },
        status: { [Op.in]: paidStatuses },
      },
    });
    const salesLast28Days = ordersLast28Days.reduce((s, o) => s + o.total, 0);

    const pendingQuotes = await PartRequest.count({ where: { status: { [Op.in]: ['SUBMITTED', 'UNDER_REVIEW'] } } });

    const lowStockProducts = await InventoryRecord.count({
      where: { quantity: { [Op.lt]: LOW_STOCK_THRESHOLD, [Op.gt]: 0 } },
    });

    return {
      salesToday,
      salesLast28Days,
      ordersToday: ordersToday.length,
      ordersLast28Days: ordersLast28Days.length,
      pendingQuotes,
      lowStockProducts,
    };
  }

  // ── Promotions ────────────────────────────────────────────────────────────

  async resolvePromotion(code: string | undefined, subtotal: number) {
    if (!code?.trim()) return { discount: 0, code: undefined as string | undefined };
    const promo = await Promotion.findOne({
      where: { code: code.trim().toUpperCase(), active: true },
    });
    if (!promo) throw new AppError(400, 'invalid_promo', 'Promotion code is not valid');
    const now = new Date();
    if (promo.starts_at && now < promo.starts_at) {
      throw new AppError(400, 'invalid_promo', 'Promotion is not active yet');
    }
    if (promo.ends_at && now > promo.ends_at) {
      throw new AppError(400, 'invalid_promo', 'Promotion has expired');
    }
    if (promo.max_uses != null && promo.usage_count >= promo.max_uses) {
      throw new AppError(400, 'invalid_promo', 'Promotion usage limit reached');
    }
    const minOrder = Number(promo.min_order_amount) || 0;
    if (subtotal < minOrder) {
      throw new AppError(400, 'invalid_promo', `Minimum order amount is KSh ${minOrder.toLocaleString('en-KE')}`);
    }
    const value = Number(promo.value);
    const discount =
      promo.type === 'percent'
        ? Math.min(subtotal, Math.round((subtotal * value) / 100))
        : Math.min(subtotal, Math.round(value));
    await promo.update({ usage_count: promo.usage_count + 1 });
    return { discount, code: promo.code };
  }

  async validatePromotion(code: string, subtotal: number) {
    const promo = await Promotion.findOne({
      where: { code: code.trim().toUpperCase(), active: true },
    });
    if (!promo) throw new AppError(400, 'invalid_promo', 'Promotion code is not valid');
    const now = new Date();
    if (promo.starts_at && now < promo.starts_at) {
      throw new AppError(400, 'invalid_promo', 'Promotion is not active yet');
    }
    if (promo.ends_at && now > promo.ends_at) {
      throw new AppError(400, 'invalid_promo', 'Promotion has expired');
    }
    if (promo.max_uses != null && promo.usage_count >= promo.max_uses) {
      throw new AppError(400, 'invalid_promo', 'Promotion usage limit reached');
    }
    const minOrder = Number(promo.min_order_amount) || 0;
    if (subtotal < minOrder) {
      throw new AppError(400, 'invalid_promo', `Minimum order amount is KSh ${minOrder.toLocaleString('en-KE')}`);
    }
    const value = Number(promo.value);
    const discount =
      promo.type === 'percent'
        ? Math.min(subtotal, Math.round((subtotal * value) / 100))
        : Math.min(subtotal, Math.round(value));
    return {
      code: promo.code,
      name: promo.name,
      type: promo.type,
      value,
      discount,
      minOrderAmount: minOrder,
    };
  }

  async listPromotions() {
    const rows = await Promotion.findAll({ order: [['created_at', 'DESC']] });
    return rows.map((p) => this.promotionToDto(p));
  }

  async createPromotion(data: {
    code: string;
    name: string;
    type: 'percent' | 'fixed';
    value: number;
    minOrderAmount?: number;
    active?: boolean;
    startsAt?: string;
    endsAt?: string;
    maxUses?: number;
  }) {
    const row = await Promotion.create({
      code: data.code.trim().toUpperCase(),
      name: data.name.trim(),
      type: data.type,
      value: data.value,
      min_order_amount: data.minOrderAmount ?? 0,
      active: data.active ?? true,
      starts_at: data.startsAt ? new Date(data.startsAt) : undefined,
      ends_at: data.endsAt ? new Date(data.endsAt) : undefined,
      max_uses: data.maxUses,
    });
    return this.promotionToDto(row);
  }

  async updatePromotion(
    id: string,
    data: Partial<{
      code: string;
      name: string;
      type: 'percent' | 'fixed';
      value: number;
      minOrderAmount: number;
      active: boolean;
      startsAt: string;
      endsAt: string;
      maxUses: number;
    }>,
  ) {
    const row = await Promotion.findByPk(id);
    if (!row) return null;
    await row.update({
      ...(data.code !== undefined ? { code: data.code.trim().toUpperCase() } : {}),
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.value !== undefined ? { value: data.value } : {}),
      ...(data.minOrderAmount !== undefined ? { min_order_amount: data.minOrderAmount } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
      ...(data.startsAt !== undefined ? { starts_at: data.startsAt ? new Date(data.startsAt) : null } : {}),
      ...(data.endsAt !== undefined ? { ends_at: data.endsAt ? new Date(data.endsAt) : null } : {}),
      ...(data.maxUses !== undefined ? { max_uses: data.maxUses } : {}),
    });
    return this.promotionToDto(row);
  }

  private promotionToDto(p: Promotion) {
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      type: p.type,
      value: Number(p.value),
      minOrderAmount: Number(p.min_order_amount),
      active: p.active,
      startsAt: p.starts_at?.toISOString() ?? null,
      endsAt: p.ends_at?.toISOString() ?? null,
      usageCount: p.usage_count,
      maxUses: p.max_uses ?? null,
    };
  }

  // ── Returns ───────────────────────────────────────────────────────────────

  async createReturnRequest(userId: string, data: { orderId: string; reason: string }) {
    const order = await Order.findOne({
      where: { ...orderIdWhere(data.orderId), user_id: userId } as never,
    });
    if (!order) throw new AppError(404, 'not_found', 'Order not found');
    if (!['PAID', 'PROCESSING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED'].includes(order.status)) {
      throw new AppError(400, 'invalid_status', 'This order cannot be returned');
    }
    const existing = await ReturnRequest.findOne({
      where: { order_id: order.id, status: { [Op.in]: ['REQUESTED', 'APPROVED'] } },
    });
    if (existing) throw new AppError(400, 'return_exists', 'A return request is already open for this order');
    const row = await ReturnRequest.create({
      return_number: nextReturnNumber(),
      order_id: order.id,
      user_id: userId,
      reason: data.reason.trim(),
      status: 'REQUESTED',
    });
    return this.returnToDto(row, order.order_number);
  }

  async listReturnRequests(userId?: string) {
    const where = userId ? { user_id: userId } : {};
    const rows = await ReturnRequest.findAll({
      where,
      include: [
        { model: Order, attributes: ['order_number', 'total', 'status'] },
        { model: User, attributes: ['name', 'email'] },
      ],
      order: [['created_at', 'DESC']],
    });
    return rows.map((r) =>
      this.returnToDto(r, r.order?.order_number, !userId ? r.user?.name : undefined, !userId ? r.user?.email : undefined),
    );
  }

  async updateReturnRequest(
    id: string,
    data: { status: 'APPROVED' | 'REJECTED' | 'REFUNDED'; refundAmount?: number; adminNotes?: string },
  ) {
    const row = await ReturnRequest.findByPk(id, { include: [Order] });
    if (!row) return null;
    await row.update({
      status: data.status,
      ...(data.refundAmount !== undefined ? { refund_amount: data.refundAmount } : {}),
      ...(data.adminNotes !== undefined ? { admin_notes: data.adminNotes.trim() } : {}),
    });
    return this.returnToDto(row, row.order?.order_number);
  }

  private returnToDto(r: ReturnRequest, orderNumber?: string, customerName?: string, customerEmail?: string) {
    return {
      id: r.id,
      returnNumber: r.return_number,
      orderId: orderNumber ?? r.order_id,
      reason: r.reason,
      status: r.status,
      refundAmount: r.refund_amount != null ? Number(r.refund_amount) : null,
      adminNotes: r.admin_notes ?? null,
      createdAt: r.createdAt,
      customerName,
      customerEmail,
    };
  }
}
