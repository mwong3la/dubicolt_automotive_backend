import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../database/models/User';
import { Category } from '../database/models/Category';
import { Product } from '../database/models/Product';
import { CartItem } from '../database/models/CartItem';
import { CheckoutSession } from '../database/models/CheckoutSession';
import { SourcingRequest } from '../database/models/SourcingRequest';
import { SourcingQuote } from '../database/models/SourcingQuote';
import { SourcingAttachment } from '../database/models/SourcingAttachment';
import { Shipment } from '../database/models/Shipment';
import { MarketplaceOrder } from '../database/models/MarketplaceOrder';
import { AdminSourcingOrder } from '../database/models/AdminSourcingOrder';
import * as mappers from '../database/mappers';
import { formatKsh, formatKshAmount, usdToKes } from '../utils/currency';
import type { HubCode, DubikenUser } from './types';

function paginate<T>(items: T[], page: number, pageSize: number) {
  const p = Math.max(1, page);
  const ps = Math.max(1, pageSize);
  const start = (p - 1) * ps;
  return { data: items.slice(start, start + ps), meta: { page: p, page_size: ps, total: items.length } };
}

function formatUsd(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('$') ? trimmed : `$${trimmed}`;
}

/** All application data access via PostgreSQL */
export class PostgresStore {
  async init(): Promise<void> {
    await this.syncStorefrontFromInventory();
    await this.refreshInventoryKpis();
  }

  /** Publish inventory to storefront (auto on boot if none published; force via admin) */
  async syncStorefrontFromInventory(options?: { force?: boolean }) {
    const total = await Product.count();
    const publishedBefore = await Product.count({ where: { on_marketplace: true } });
    const shouldPublish = options?.force || (total > 0 && publishedBefore === 0);

    if (shouldPublish && total > 0) {
      await Product.update(
        { on_marketplace: true, marketplace_cta: 'cart' },
        { where: options?.force ? {} : { on_marketplace: false } },
      );
      console.log(
        `Storefront: published ${total} product(s) to marketplace${options?.force ? ' (manual sync)' : ''}`,
      );
    }

    const published_count = await Product.count({ where: { on_marketplace: true } });
    return { published_count, total_products: total };
  }

  async findUserByEmail(email: string): Promise<DubikenUser | undefined> {
    const u = await User.findOne({ where: { email: { [Op.iLike]: email } } });
    return u ? mappers.userToDomain(u) : undefined;
  }

  async getUser(id: string): Promise<DubikenUser | undefined> {
    const u = await User.findByPk(id);
    return u ? mappers.userToDomain(u) : undefined;
  }

  async createUser(data: {
    email: string;
    password: string;
    company_name: string;
    name?: string;
  }): Promise<DubikenUser> {
    const row = await User.create({
      email: data.email,
      password: await bcrypt.hash(data.password, 10),
      name: data.name ?? data.email.split('@')[0],
      company: data.company_name,
      role: 'buyer',
      is_active: true,
    });
    return mappers.userToDomain(row);
  }

  toPublicUser(u: DubikenUser) {
    return { id: u.id, email: u.email, name: u.name, company: u.company, role: u.role };
  }

  async getProduct(id: string) {
    const p = await Product.findByPk(id);
    return p ? mappers.productToDto(p) : undefined;
  }

  async getRelatedProducts(excludeId: string, limit: number) {
    const rows = await Product.findAll({ limit: limit + 1 });
    return rows
      .filter((p) => p.id !== excludeId)
      .slice(0, limit)
      .map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price_usd),
        origin: p.origin,
        image_url: p.image_url,
      }));
  }

  async listMarketplace(filters: {
    hub?: string;
    category?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }) {
    const page = filters.page ?? 1;
    const pageSize = filters.page_size ?? 24;

    const hubFilter =
      filters.hub && filters.hub !== 'all' ? filters.hub : undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buildWhere = (marketplaceOnly: boolean): any => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = marketplaceOnly ? { on_marketplace: true } : {};
      if (hubFilter) where.origin = hubFilter;
      if (filters.category) where.category = filters.category;
      if (filters.search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${filters.search}%` } },
          { vendor: { [Op.iLike]: `%${filters.search}%` } },
        ];
      }
      return where;
    };

    let rows = await Product.findAll({
      where: buildWhere(true),
      order: [['updated_at', 'DESC']],
    });

    // Only broaden when browsing all hubs — never ignore an explicit hub filter
    if (
      rows.length === 0 &&
      !hubFilter &&
      !filters.search &&
      !filters.category
    ) {
      rows = await Product.findAll({
        where: buildWhere(false),
        order: [['updated_at', 'DESC']],
      });
    }

    return paginate(rows.map(mappers.productToMarketplace), page, pageSize);
  }

  async listStorefrontCategories() {
    let rows = await Category.findAll({
      where: { status: 'published' },
      order: [['name', 'ASC']],
    });
    if (rows.length === 0) {
      rows = await Category.findAll({ order: [['name', 'ASC']], limit: 8 });
    }
    const result = [];
    for (const c of rows) {
      const product_count = await Product.count({
        where: { category: c.name, on_marketplace: true },
      });
      result.push({
        id: c.id,
        name: c.name,
        origin: c.origins[0] ?? 'KE',
        product_count: product_count > 0 ? product_count : c.total_skus,
        image_url: c.image_url,
      });
    }
    return result;
  }

  async getHomeFeed() {
    const categories = await this.listStorefrontCategories();
    const marketplace = await this.listMarketplace({ page: 1, page_size: 12 });
    return { categories, products: marketplace.data, meta: marketplace.meta };
  }

  async getCart(userId: string) {
    const rows = await CartItem.findAll({
      where: { user_id: userId },
      include: [Product],
    });
    const items = rows.map(mappers.cartItemToDto);
    const item_count = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
    return { items, item_count, subtotal };
  }

  async addCartItem(userId: string, productId: string, quantity: number) {
    const product = await Product.findByPk(productId);
    if (!product) return null;
    const existing = await CartItem.findOne({ where: { user_id: userId, product_id: productId } });
    if (existing) {
      await existing.update({ quantity: existing.quantity + quantity });
    } else {
      await CartItem.create({ user_id: userId, product_id: productId, quantity });
    }
    return this.getCart(userId);
  }

  async updateCartItem(userId: string, lineId: string, quantity: number) {
    const row = await CartItem.findOne({ where: { id: lineId, user_id: userId } });
    if (!row) return null;
    if (quantity <= 0) await row.destroy();
    else await row.update({ quantity });
    return this.getCart(userId);
  }

  async removeCartItem(userId: string, lineId: string) {
    await CartItem.destroy({ where: { id: lineId, user_id: userId } });
    return this.getCart(userId);
  }

  async createCheckoutShipping(userId: string, shipping: Record<string, string>) {
    const cart = await this.getCart(userId);
    const subtotal = cart.subtotal;
    const shippingFee = Math.round(subtotal * 0.0296 * 100) / 100;
    const customs = Math.round(subtotal * 0.08 * 100) / 100;
    const insurance = Math.round(subtotal * 0.01 * 100) / 100;
    const total = Math.round((subtotal + shippingFee + customs + insurance) * 100) / 100;
    const summary = { subtotal, shipping: shippingFee, customs, insurance, total, currency: 'KES' as const };
    const session = await CheckoutSession.create({ user_id: userId, shipping, summary });
    return { checkout_id: session.id, shipping, summary };
  }

  async completeCheckout(checkoutId: string) {
    const session = await CheckoutSession.findByPk(checkoutId);
    if (!session?.user_id) return null;
    const cart = await this.getCart(session.user_id);
    const created: { order_id: string; order_number: string }[] = [];
    const eta = new Date();
    eta.setDate(eta.getDate() + 14);
    const etaLabel = eta.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });

    for (const item of cart.items) {
      const lineKes = usdToKes(item.unit_price * item.quantity);
      const orderNumber = `DBK-${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 90)}`;
      const row = await MarketplaceOrder.create({
        user_id: session.user_id,
        order_number: orderNumber,
        title: item.quantity > 1 ? `${item.name} (×${item.quantity})` : item.name,
        vendor: 'Dubiken Marketplace',
        origin_flag: item.origin,
        image_url: item.image_url,
        status: 'PROCESSING',
        status_icon: 'processing',
        progress_step: 1,
        price_kes: formatKshAmount(lineKes),
        price_secondary: '',
        date_label: 'ETA',
        date_value: etaLabel,
        primary_action: 'Track Package',
        secondary_action: 'Order Details',
        primary_style: 'navy',
      });
      created.push({ order_id: row.id, order_number: row.order_number });
    }

    await CartItem.destroy({ where: { user_id: session.user_id } });
    await session.destroy();
    const first = created[0];
    return first
      ? { order_id: first.order_id, order_number: first.order_number, orders: created }
      : {
          order_id: `ord-${uuidv4().slice(0, 6)}`,
          order_number: String(Math.floor(88000 + Math.random() * 999)),
          orders: [],
        };
  }

  async getUserSourcingDashboard(userId: string) {
    const requests = await SourcingRequest.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
    });
    const list = requests.map(mappers.sourcingToUserList);
    const pending_quotes = list.filter((r) =>
      ['PENDING', 'PENDING QUOTE', 'pending_quote', 'pending'].includes(
        String(r.status).toUpperCase(),
      ),
    ).length;
    const procured = list.reduce((sum, r) => {
      const n = parseFloat(String(r.price).replace(/[^0-9.]/g, ''));
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
    const procured_total =
      procured >= 1000 ? `$${(procured / 1000).toFixed(0)}k` : `$${procured.toFixed(0)}`;
    return {
      summary: {
        active: list.length,
        pending_quotes,
        procured_total: list.length ? procured_total : '$0',
      },
      requests: list,
    };
  }

  async getUserSourcingDetail(id: string) {
    const sr = await SourcingRequest.findByPk(id, {
      include: [SourcingQuote, SourcingAttachment],
    });
    if (!sr || !sr.user_id) return null;
    return mappers.sourcingToUserDetail(sr);
  }

  async createUserSourcingRequest(userId: string, body: Record<string, unknown>) {
    const user = await User.findByPk(userId);
    const requestNumber = `DBK-${Math.floor(90000 + Math.random() * 9999)}`;
    const quantityLabel = `${body.quantity} ${body.unit}`;
    const sr = await SourcingRequest.create({
      user_id: userId,
      request_number: requestNumber,
      product_title: String(body.product_name),
      description: String(body.description),
      category: String(body.category),
      urgency: String(body.urgency),
      origin: String(body.origin),
      destination: String(body.destination),
      quantity: quantityLabel,
      unit: String(body.unit),
      target_date: String(body.target_date),
      shipping_method: String(body.shipping_method),
      budget: body.budget ? String(body.budget) : undefined,
      status: 'pending',
      market: String(body.origin),
      user_status: 'PENDING',
      status_variant: 'gray',
      client_name: user?.name,
      client_initials: user?.name
        ?.split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      budget_total: 'Pending quote',
      budget_subtitle: 'Target Budget',
      regional_targets: [
        { code: String(body.origin), label: String(body.origin) },
        { code: String(body.destination), label: String(body.destination) },
      ],
      reference_images: [],
    });
    return mappers.sourcingToUserList(sr);
  }

  async listAdminSourcing(filters: {
    market?: string;
    status?: string[];
    page?: number;
    page_size?: number;
  }) {
    const where: Record<string, unknown> = {};
    if (filters.market && filters.market !== 'all') where.market = filters.market;
    if (filters.status?.length) where.status = { [Op.in]: filters.status };
    const rows = await SourcingRequest.findAll({
      where: where as never,
      order: [['created_at', 'DESC']],
    });
    return paginate(rows.map(mappers.sourcingToAdminList), filters.page ?? 1, filters.page_size ?? 10);
  }

  async getAdminSourcingDetail(id: string) {
    const sr = await SourcingRequest.findByPk(id, {
      include: [SourcingQuote, SourcingAttachment],
    });
    if (!sr) return null;
    return mappers.sourcingToAdminDetail(sr);
  }

  async saveOfficialQuote(
    requestId: string,
    input: {
      unit_price: string;
      shipping_cost?: string;
      transport: string;
      lead_time_days: string;
      notes?: string;
    },
  ) {
    const sr = await SourcingRequest.findByPk(requestId);
    if (!sr) return null;

    await SourcingQuote.destroy({ where: { sourcing_request_id: requestId, official: true } });
    const quote = await SourcingQuote.create({
      sourcing_request_id: requestId,
      unit_price: formatUsd(input.unit_price),
      shipping_cost: input.shipping_cost ? formatUsd(input.shipping_cost) : undefined,
      lead_time: `${input.lead_time_days.trim()} Days`,
      shipment: input.transport.trim(),
      notes: input.notes?.trim() ?? '',
      official: true,
    });

    if (sr.status === 'pending') await sr.update({ status: 'quoted' });
    if (sr.user_id) {
      await sr.update({ user_status: 'QUOTED', status_variant: 'orange' });
    }

    return { quote: mappers.quoteToDto(quote), request_status: sr.status };
  }

  async listCategories() {
    const rows = await Category.findAll({ order: [['name', 'ASC']] });
    return { data: rows.map(mappers.categoryToAdmin) };
  }

  async getCategory(id: string) {
    const c = await Category.findByPk(id);
    return c ? mappers.categoryToAdmin(c) : null;
  }

  async upsertCategory(input: {
    id?: string;
    name: string;
    description: string;
    origins: HubCode[];
    image_url: string;
    status: 'draft' | 'published';
  }) {
    if (input.id) {
      const c = await Category.findByPk(input.id);
      if (!c) throw new Error('Category not found');
      await c.update(input);
      return mappers.categoryToAdmin(c);
    }
    const c = await Category.create(input);
    return mappers.categoryToAdmin(c);
  }

  inventoryKpis = {
    total_active_products: 0,
    new_this_week: 0,
    total_inventory_value: '$2.4M',
    hubs_label: 'Across 3 Hubs',
    low_stock_count: 0,
  };

  async refreshInventoryKpis() {
    this.inventoryKpis = await this.loadInventoryKpis();
  }

  private async loadInventoryKpis() {
    const total = await Product.count();
    const low = await Product.count({ where: { low_stock: true } });
    return {
      total_active_products: total,
      new_this_week: 0,
      total_inventory_value: '$2.4M',
      hubs_label: 'Across 3 Hubs',
      low_stock_count: low,
    };
  }

  async listInventory(filters: { search?: string; page?: number; page_size?: number }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (filters.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${filters.search}%` } },
        { sku: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }
    const rows = await Product.findAll({ where, order: [['name', 'ASC']] });
    return paginate(rows.map(mappers.productToInventory), filters.page ?? 1, filters.page_size ?? 20);
  }

  async createInventoryProduct(body: {
    name: string;
    sku: string;
    category: string;
    brand?: string;
    description?: string;
    primary_origin: HubCode;
    price_usd: number;
    stock: number;
    image_url: string;
    images?: string[];
    attributes?: { feature: string; value: string }[];
  }) {
    const specs = body.attributes?.length
      ? Object.fromEntries(body.attributes.map((a) => [a.feature, a.value]))
      : {};
    const row = await Product.create({
      sku: body.sku,
      name: body.name,
      description: body.description ?? body.name,
      brand: body.brand,
      category: body.category,
      origin: body.primary_origin,
      price_usd: body.price_usd,
      currency_ke: formatKsh(body.price_usd),
      currency_ae: formatKsh(body.price_usd),
      image_url: body.image_url,
      images: body.images ?? [body.image_url],
      specs,
      stock: body.stock,
      low_stock: body.stock < 25,
      on_marketplace: true,
      marketplace_cta: 'cart',
      vendor: body.brand ?? 'Dubiken',
    });
    await this.refreshInventoryKpis();
    return {
      id: row.id,
      sku: row.sku,
      name: row.name,
      marketplace_price: formatKsh(body.price_usd),
      stock: row.stock,
      low_stock: row.low_stock,
    };
  }

  async getInventoryProduct(id: string) {
    const row = await Product.findByPk(id);
    if (!row) return null;
    const images = row.images?.length ? row.images : [row.image_url];
    const gallery = images.filter((u) => u && u !== row.image_url);
    const specs = row.specs ?? {};
    return {
      id: row.id,
      name: row.name,
      sku: row.sku,
      category: row.category,
      brand: row.brand ?? row.vendor ?? '',
      description: row.description ?? '',
      primary_origin: row.origin as HubCode,
      price_usd: Number(row.price_usd),
      original_price: row.original_price != null ? Number(row.original_price) : null,
      stock: row.stock,
      image_url: row.image_url,
      images,
      gallery_images: gallery,
      attributes: Object.entries(specs).map(([feature, value]) => ({ feature, value })),
      on_marketplace: row.on_marketplace,
      marketplace_cta: row.marketplace_cta,
    };
  }

  async updateInventoryProduct(
    id: string,
    body: Partial<{
      name: string;
      sku: string;
      category: string;
      primary_origin: HubCode;
      price_usd: number;
      stock: number;
      image_url: string;
      images?: string[];
      description?: string;
      brand?: string;
      attributes?: { feature: string; value: string }[];
      on_marketplace?: boolean;
      marketplace_cta?: 'cart' | 'quote';
      original_price?: number | null;
    }>,
  ) {
    const row = await Product.findByPk(id);
    if (!row) return null;
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.sku !== undefined) updates.sku = body.sku;
    if (body.category !== undefined) updates.category = body.category;
    if (body.description !== undefined) updates.description = body.description;
    if (body.brand !== undefined) {
      updates.brand = body.brand;
      updates.vendor = body.brand || row.vendor;
    }
    if (body.primary_origin !== undefined) updates.origin = body.primary_origin;
    if (body.price_usd !== undefined) {
      updates.price_usd = body.price_usd;
      updates.currency_ke = formatKsh(body.price_usd);
      updates.currency_ae = formatKsh(body.price_usd);
    }
    if (body.original_price !== undefined) updates.original_price = body.original_price;
    if (body.image_url !== undefined) updates.image_url = body.image_url;
    if (body.images !== undefined) updates.images = body.images;
    if (body.stock !== undefined) {
      updates.stock = body.stock;
      updates.low_stock = body.stock < 25;
    }
    if (body.on_marketplace !== undefined) updates.on_marketplace = body.on_marketplace;
    updates.marketplace_cta = 'cart';
    if (body.attributes !== undefined) {
      updates.specs = body.attributes.length
        ? Object.fromEntries(body.attributes.map((a) => [a.feature, a.value]))
        : {};
    }
    await row.update(updates);
    await this.refreshInventoryKpis();
    return {
      id: row.id,
      sku: row.sku,
      name: row.name,
      marketplace_price: formatKsh(Number(row.price_usd)),
      stock: row.stock,
      low_stock: row.low_stock,
    };
  }

  async getShipment(trackingId: string) {
    const s = await Shipment.findOne({ where: { tracking_id: trackingId } });
    return s ? mappers.shipmentToDto(s) : null;
  }

  async listShipments() {
    const rows = await Shipment.findAll({ order: [['updated_at', 'DESC']] });
    return rows.map((s) => mappers.shipmentToDto(s));
  }

  async addSourcingAttachment(
    requestId: string,
    data: { name: string; size: string; type: 'pdf' | 'zip'; url: string },
  ) {
    await SourcingAttachment.create({
      sourcing_request_id: requestId,
      ...data,
    });
  }

  async getAdminDashboard() {
    const active_requests = await SourcingRequest.count({
      where: { status: { [Op.in]: ['pending', 'quoted', 'shipping'] } },
    });
    const pending_quotes = await SourcingRequest.count({ where: { status: 'pending' } });
    const delayed_shipments = await Shipment.count({
      where: { current_status: { [Op.iLike]: '%transit%' } },
    });

    const recent = await SourcingRequest.findAll({
      order: [['updated_at', 'DESC']],
      limit: 6,
    });

    const statusLabel: Record<string, { label: string; variant: 'orange' | 'blue' | 'red' }> = {
      pending: { label: 'Pending Quote', variant: 'orange' },
      quoted: { label: 'Quoted', variant: 'blue' },
      shipping: { label: 'Shipping', variant: 'blue' },
      delivered: { label: 'Delivered', variant: 'blue' },
    };

    const sourcing_rows = recent.map((sr) => {
      const tag = statusLabel[sr.status] ?? { label: sr.status, variant: 'orange' as const };
      return {
        id: sr.id,
        origin: sr.origin,
        destination: sr.market,
        product_title: sr.product_title,
        quantity: sr.quantity ?? '—',
        vendor: sr.client_name ?? '—',
        status_tags: [{ label: tag.label, variant: tag.variant }],
        time_ago: timeAgo(sr.updatedAt ?? sr.createdAt),
        primary_action: {
          label: sr.status === 'pending' ? 'Provide Quote' : 'View Details',
          style: sr.status === 'pending' ? ('solid' as const) : ('outline' as const),
        },
        secondary_action:
          sr.status === 'pending'
            ? { label: 'View Details', style: 'outline' as const }
            : undefined,
      };
    });

    const shipmentRows = await Shipment.findAll({ limit: 3, order: [['updated_at', 'DESC']] });
    const logistics = shipmentRows.map((s) => ({
      tracking_id: s.tracking_id,
      mode: 'Sea' as const,
      status: s.current_status.toUpperCase().includes('TRANSIT') ? 'TRANSIT' : 'CUSTOMS',
      status_variant: 'orange' as const,
      route_from: s.origin_city,
      route_to: s.destination_city,
      eta: s.milestones?.find((m) => !m.done)?.date ?? '—',
    }));

    const productValue = await Product.sum('price_usd');
    const stockSum = await Product.sum('stock');

    return {
      kpis: {
        global_sales_usd: Math.round(Number(productValue ?? 0) * Number(stockSum ?? 0) * 0.01) || 0,
        global_sales_change: '+12.4% vs LW',
        active_requests,
        pending_quotes,
        otd_percent: 94,
        delayed_shipments,
      },
      sourcing_rows,
      logistics,
    };
  }

  async listAdminSourcingOrders() {
    const rows = await AdminSourcingOrder.findAll({ order: [['created_at', 'DESC']] });
    return rows.map((o) => ({
      id: o.id,
      order_number: o.order_number,
      customer_name: o.customer_name,
      customer_detail: o.customer_detail,
      route: o.route,
      estimated_value: Number(o.estimated_value),
      status: o.status,
      status_variant: o.status_variant,
      primary_action: o.primary_action,
      secondary_action: o.secondary_action,
    }));
  }

  async listUserMarketplaceOrders(userId?: string) {
    const rows = await MarketplaceOrder.findAll({
      where: userId ? { user_id: userId } : undefined,
      order: [['created_at', 'DESC']],
    });
    return rows.map(mappers.marketplaceOrderToDto);
  }

  async listAdminMarketplaceOrders() {
    const rows = await MarketplaceOrder.findAll({
      include: [{ model: User, attributes: ['name', 'email', 'company'] }],
      order: [['created_at', 'DESC']],
    });
    return rows.map((o) => ({
      ...mappers.marketplaceOrderToDto(o),
      customer_name: o.user?.name ?? o.user?.email ?? 'Buyer',
      customer_detail: o.user?.company ?? o.user?.email ?? '',
    }));
  }

  async listUserShipments(userId: string) {
    const orders = await MarketplaceOrder.findAll({
      where: { user_id: userId },
      attributes: ['tracking_id'],
    });
    const trackingIds = [
      ...new Set(orders.map((o) => o.tracking_id).filter((id): id is string => !!id)),
    ];
    if (trackingIds.length === 0) return [];
    const rows = await Shipment.findAll({ where: { tracking_id: trackingIds } });
    return rows.map(mappers.shipmentToDto);
  }

  async listExploreCategoriesPaginated(page = 1, pageSize = 12) {
    const categories = await this.listStorefrontCategories();
    return paginate(categories, page, pageSize);
  }

  async getAdminAnalytics() {
    const orders = await MarketplaceOrder.findAll({ order: [['created_at', 'ASC']] });
    const now = Date.now();
    const weekMs = 7 * 24 * 3600 * 1000;
    const weekly_volume = [0, 1, 2, 3].map((w) => {
      const end = now - (3 - w) * weekMs;
      const start = end - weekMs;
      const inWeek = orders.filter((o) => {
        const t = o.createdAt?.getTime() ?? 0;
        return t >= start && t < end;
      });
      const scale = (flag: string) =>
        inWeek.filter((o) => o.origin_flag === flag).length * 80 +
        inWeek.reduce((s, o) => s + o.progress_step * 10, 0);
      return {
        week: `Week ${w + 1}`,
        kenya: scale('KE'),
        dubai: scale('AE'),
        china: scale('CN'),
      };
    });

    const products = await Product.findAll({ where: { on_marketplace: true } });
    const byCat = new Map<string, number>();
    for (const p of products) {
      const val = Number(p.price_usd) * Math.max(1, p.stock);
      byCat.set(p.category, (byCat.get(p.category) ?? 0) + val);
    }
    const sorted = [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxVal = sorted[0]?.[1] ?? 1;
    const top_categories = sorted.map(([name, value_usd]) => ({
      name,
      value_usd: Math.round(value_usd),
      pct: Math.round((value_usd / maxVal) * 100),
    }));

    return { weekly_volume, top_categories };
  }
}

function timeAgo(date?: Date): string {
  if (!date) return '—';
  const ms = Date.now() - date.getTime();
  const hours = Math.floor(ms / 3600000);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
