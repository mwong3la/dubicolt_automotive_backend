"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MvpStore = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const sequelize_1 = require("sequelize");
const AppError_1 = require("../errors/AppError");
const db_1 = require("../database/db");
const User_1 = require("../database/models/User");
const Product_1 = require("../database/models/Product");
const CartItem_1 = require("../database/models/CartItem");
const Vehicle_1 = require("../database/models/Vehicle");
const InventoryRecord_1 = require("../database/models/InventoryRecord");
const Order_1 = require("../database/models/Order");
const OrderItem_1 = require("../database/models/OrderItem");
const Payment_1 = require("../database/models/Payment");
const PartRequest_1 = require("../database/models/PartRequest");
const Quotation_1 = require("../database/models/Quotation");
const Supplier_1 = require("../database/models/Supplier");
const Delivery_1 = require("../database/models/Delivery");
const seed_runner_1 = require("../database/seed-runner");
const LOW_STOCK_THRESHOLD = 10;
function productSellingPrice(p) {
    if (p.price_kes != null && Number(p.price_kes) > 0)
        return Math.round(Number(p.price_kes));
    return Math.round(Number(p.price_usd) * 130);
}
function toPublicUser(u) {
    return { id: u.id, email: u.email, name: u.name, company: u.company, role: u.role };
}
function toDomainUser(u) {
    return {
        id: u.id,
        email: u.email,
        passwordHash: u.password,
        name: u.name,
        company: u.company,
        role: u.role,
    };
}
function productToMvp(p, qty) {
    return {
        id: p.id,
        title: p.name,
        sku: p.sku,
        description: p.description ?? '',
        category: p.category,
        brand: p.brand ?? p.vendor ?? '',
        oemNumber: p.oem_number ?? '',
        sellingPrice: productSellingPrice(p),
        imageUrl: p.image_url,
        compatibleVehicles: p.compatible_vehicles ?? [],
        stock: qty ?? p.stock,
    };
}
function nextOrderNumber() {
    return `ORD${Date.now().toString().slice(-6)}`;
}
function nextRequestNumber() {
    return `REQ${Date.now().toString().slice(-6)}`;
}
async function getOrCreateInventory(productId, transaction) {
    let record = await InventoryRecord_1.InventoryRecord.findOne({ where: { product_id: productId }, transaction });
    if (!record) {
        const product = await Product_1.Product.findByPk(productId, { transaction });
        const qty = Math.max(0, Number(product?.stock) || 0);
        record = await InventoryRecord_1.InventoryRecord.create({ product_id: productId, quantity: qty }, { transaction });
    }
    return record;
}
async function syncProductStock(productId, quantity, transaction) {
    const product = await Product_1.Product.findByPk(productId, { transaction });
    if (product) {
        await product.update({ stock: quantity, low_stock: quantity > 0 && quantity < LOW_STOCK_THRESHOLD }, { transaction });
    }
}
class MvpStore {
    async init() {
        await (0, seed_runner_1.seedDubicoltMvpCatalog)();
        await this.syncInventoryFromProducts();
    }
    async syncInventoryFromProducts() {
        const products = await Product_1.Product.findAll();
        for (const p of products) {
            const existing = await InventoryRecord_1.InventoryRecord.findOne({ where: { product_id: p.id } });
            if (!existing) {
                await InventoryRecord_1.InventoryRecord.create({
                    product_id: p.id,
                    quantity: Math.max(0, Number(p.stock) || 0),
                });
            }
        }
    }
    // ── Auth ──────────────────────────────────────────────────────────────────
    async findUserByEmail(email) {
        const u = await User_1.User.findOne({ where: { email: { [sequelize_1.Op.iLike]: email } } });
        return u ? toDomainUser(u) : undefined;
    }
    async getUser(id) {
        const u = await User_1.User.findByPk(id);
        return u ? toDomainUser(u) : undefined;
    }
    async createUser(data) {
        const row = await User_1.User.create({
            email: data.email,
            password: await bcrypt_1.default.hash(data.password, 10),
            name: data.name.trim(),
            company: '',
            role: 'buyer',
            is_active: true,
        });
        return toDomainUser(row);
    }
    toPublicUser(u) {
        return { id: u.id, email: u.email, name: u.name, role: u.role };
    }
    // ── Vehicles ────────────────────────────────────────────────────────────
    async createVehicle(userId, data) {
        const row = await Vehicle_1.Vehicle.create({ user_id: userId, ...data });
        return this.vehicleToDto(row);
    }
    async listVehicles(userId) {
        const rows = await Vehicle_1.Vehicle.findAll({ where: { user_id: userId }, order: [['created_at', 'DESC']] });
        return rows.map((v) => this.vehicleToDto(v));
    }
    async updateVehicle(userId, id, data) {
        const row = await Vehicle_1.Vehicle.findOne({ where: { id, user_id: userId } });
        if (!row)
            return null;
        await row.update(data);
        return this.vehicleToDto(row);
    }
    async deleteVehicle(userId, id) {
        const deleted = await Vehicle_1.Vehicle.destroy({ where: { id, user_id: userId } });
        return deleted > 0;
    }
    vehicleToDto(v) {
        return { id: v.id, make: v.make, model: v.model, year: v.year, engine: v.engine, vin: v.vin };
    }
    // ── Products ────────────────────────────────────────────────────────────
    async createProduct(data) {
        const row = await Product_1.Product.create({
            sku: data.sku,
            name: data.title,
            description: data.description,
            category: data.category,
            brand: data.brand,
            oem_number: data.oemNumber,
            compatible_vehicles: data.compatibleVehicles ?? [],
            price_kes: data.sellingPrice,
            price_usd: data.sellingPrice / 130,
            image_url: data.imageUrl,
            images: [data.imageUrl],
            origin: 'KE',
            specs: {},
            stock: 0,
            status: 'published',
            on_marketplace: true,
            marketplace_cta: 'cart',
            vendor: data.brand,
        });
        await InventoryRecord_1.InventoryRecord.create({ product_id: row.id, quantity: 0 });
        return productToMvp(row, 0);
    }
    async listProducts() {
        const rows = await Product_1.Product.findAll({ order: [['name', 'ASC']] });
        const result = [];
        for (const p of rows) {
            const inv = await InventoryRecord_1.InventoryRecord.findOne({ where: { product_id: p.id } });
            result.push(productToMvp(p, inv?.quantity ?? p.stock));
        }
        return result;
    }
    async getProduct(id) {
        const p = await Product_1.Product.findByPk(id);
        if (!p)
            return null;
        const inv = await InventoryRecord_1.InventoryRecord.findOne({ where: { product_id: p.id } });
        return productToMvp(p, inv?.quantity ?? p.stock);
    }
    async updateProduct(id, data) {
        const row = await Product_1.Product.findByPk(id);
        if (!row)
            return null;
        const updates = {};
        if (data.title !== undefined)
            updates.name = data.title;
        if (data.sku !== undefined)
            updates.sku = data.sku;
        if (data.description !== undefined)
            updates.description = data.description;
        if (data.category !== undefined)
            updates.category = data.category;
        if (data.brand !== undefined) {
            updates.brand = data.brand;
            updates.vendor = data.brand;
        }
        if (data.oemNumber !== undefined)
            updates.oem_number = data.oemNumber;
        if (data.sellingPrice !== undefined) {
            updates.price_kes = data.sellingPrice;
            updates.price_usd = data.sellingPrice / 130;
        }
        if (data.imageUrl !== undefined)
            updates.image_url = data.imageUrl;
        if (data.compatibleVehicles !== undefined)
            updates.compatible_vehicles = data.compatibleVehicles;
        await row.update(updates);
        const inv = await InventoryRecord_1.InventoryRecord.findOne({ where: { product_id: row.id } });
        return productToMvp(row, inv?.quantity ?? row.stock);
    }
    async searchProducts(filters) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where = { status: 'published' };
        if (filters.category)
            where.category = { [sequelize_1.Op.iLike]: filters.category };
        if (filters.brand)
            where.brand = { [sequelize_1.Op.iLike]: filters.brand };
        if (filters.keyword) {
            where[sequelize_1.Op.or] = [
                { name: { [sequelize_1.Op.iLike]: `%${filters.keyword}%` } },
                { sku: { [sequelize_1.Op.iLike]: `%${filters.keyword}%` } },
                { oem_number: { [sequelize_1.Op.iLike]: `%${filters.keyword}%` } },
                { description: { [sequelize_1.Op.iLike]: `%${filters.keyword}%` } },
            ];
        }
        let rows = await Product_1.Product.findAll({ where, order: [['name', 'ASC']] });
        if (filters.make || filters.model || filters.year) {
            rows = rows.filter((p) => {
                const vehicles = p.compatible_vehicles ?? [];
                if (vehicles.length === 0)
                    return !filters.make && !filters.model && !filters.year;
                return vehicles.some((v) => {
                    if (filters.make && v.make.toLowerCase() !== filters.make.toLowerCase())
                        return false;
                    if (filters.model && v.model.toLowerCase() !== filters.model.toLowerCase())
                        return false;
                    if (filters.year && (filters.year < v.yearFrom || filters.year > v.yearTo))
                        return false;
                    return true;
                });
            });
        }
        const result = [];
        for (const p of rows) {
            const inv = await InventoryRecord_1.InventoryRecord.findOne({ where: { product_id: p.id } });
            result.push(productToMvp(p, inv?.quantity ?? p.stock));
        }
        return result;
    }
    // ── Inventory ───────────────────────────────────────────────────────────
    async stockIn(productId, quantity) {
        const product = await Product_1.Product.findByPk(productId);
        if (!product)
            throw new AppError_1.AppError(404, 'not_found', 'Product not found');
        const inv = await getOrCreateInventory(productId);
        const newQty = inv.quantity + quantity;
        await inv.update({ quantity: newQty });
        await syncProductStock(productId, newQty);
        return { productId, quantity: newQty };
    }
    async stockOut(productId, quantity) {
        const product = await Product_1.Product.findByPk(productId);
        if (!product)
            throw new AppError_1.AppError(404, 'not_found', 'Product not found');
        const inv = await getOrCreateInventory(productId);
        if (inv.quantity < quantity) {
            throw new AppError_1.AppError(400, 'insufficient_stock', `Only ${inv.quantity} units available`);
        }
        const newQty = inv.quantity - quantity;
        await inv.update({ quantity: newQty });
        await syncProductStock(productId, newQty);
        return { productId, quantity: newQty };
    }
    async listInventory() {
        const records = await InventoryRecord_1.InventoryRecord.findAll({
            include: [Product_1.Product],
            order: [['updated_at', 'DESC']],
        });
        return records.map((r) => ({
            productId: r.product_id,
            title: r.product?.name ?? '',
            sku: r.product?.sku ?? '',
            quantity: r.quantity,
            lowStock: r.quantity > 0 && r.quantity < LOW_STOCK_THRESHOLD,
        }));
    }
    // ── Cart ──────────────────────────────────────────────────────────────────
    async getCart(userId) {
        const rows = await CartItem_1.CartItem.findAll({ where: { user_id: userId }, include: [Product_1.Product] });
        const items = rows.map((r) => ({
            id: r.id,
            productId: r.product_id,
            title: r.product?.name ?? '',
            quantity: r.quantity,
            unitPrice: r.product ? productSellingPrice(r.product) : 0,
        }));
        const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
        return { items, total };
    }
    async addCartItem(userId, productId, quantity) {
        const product = await Product_1.Product.findByPk(productId);
        if (!product)
            throw new AppError_1.AppError(404, 'not_found', 'Product not found');
        const existing = await CartItem_1.CartItem.findOne({ where: { user_id: userId, product_id: productId } });
        if (existing) {
            await existing.update({ quantity: existing.quantity + quantity });
        }
        else {
            await CartItem_1.CartItem.create({ user_id: userId, product_id: productId, quantity });
        }
        return this.getCart(userId);
    }
    async updateCartItem(userId, itemId, quantity) {
        const row = await CartItem_1.CartItem.findOne({ where: { id: itemId, user_id: userId } });
        if (!row)
            throw new AppError_1.AppError(404, 'not_found', 'Cart item not found');
        if (quantity <= 0)
            await row.destroy();
        else
            await row.update({ quantity });
        return this.getCart(userId);
    }
    async removeCartItem(userId, itemId) {
        await CartItem_1.CartItem.destroy({ where: { id: itemId, user_id: userId } });
        return this.getCart(userId);
    }
    // ── Checkout ──────────────────────────────────────────────────────────────
    async checkout(userId, data) {
        const cartRows = await CartItem_1.CartItem.findAll({ where: { user_id: userId }, include: [Product_1.Product] });
        if (cartRows.length === 0)
            throw new AppError_1.AppError(400, 'empty_cart', 'Cart is empty');
        return db_1.db.transaction(async (transaction) => {
            let total = 0;
            const lineItems = [];
            for (const row of cartRows) {
                const product = row.product;
                if (!product)
                    continue;
                const inv = await getOrCreateInventory(product.id, transaction);
                if (inv.quantity < row.quantity) {
                    throw new AppError_1.AppError(400, 'insufficient_stock', `Not enough stock for "${product.name}"`);
                }
                const unitPrice = productSellingPrice(product);
                total += unitPrice * row.quantity;
                lineItems.push({ product, quantity: row.quantity, unitPrice });
            }
            const orderNumber = nextOrderNumber();
            const order = await Order_1.Order.create({
                order_number: orderNumber,
                user_id: userId,
                status: 'PENDING_PAYMENT',
                total,
                delivery_method: data.deliveryMethod,
                delivery_address: data.deliveryAddress,
            }, { transaction });
            for (const item of lineItems) {
                await OrderItem_1.OrderItem.create({
                    order_id: order.id,
                    product_id: item.product.id,
                    title: item.product.name,
                    quantity: item.quantity,
                    unit_price: item.unitPrice,
                }, { transaction });
                const inv = await getOrCreateInventory(item.product.id, transaction);
                const newQty = inv.quantity - item.quantity;
                await inv.update({ quantity: newQty }, { transaction });
                await syncProductStock(item.product.id, newQty, transaction);
            }
            await Delivery_1.Delivery.create({ order_id: order.id, status: 'PROCESSING' }, { transaction });
            await CartItem_1.CartItem.destroy({ where: { user_id: userId }, transaction });
            return { orderId: order.order_number, amount: total };
        });
    }
    // ── Orders ────────────────────────────────────────────────────────────────
    async listOrders(userId) {
        const where = userId ? { user_id: userId } : {};
        const rows = await Order_1.Order.findAll({ where, order: [['created_at', 'DESC']] });
        return rows.map((o) => ({ id: o.order_number, status: o.status, total: o.total }));
    }
    async getOrder(userId, orderId) {
        const where = {
            [sequelize_1.Op.or]: [{ order_number: orderId }, { id: orderId }],
        };
        if (userId)
            where.user_id = userId;
        const order = await Order_1.Order.findOne({
            where: where,
            include: [OrderItem_1.OrderItem, Delivery_1.Delivery],
        });
        if (!order)
            return null;
        return {
            id: order.order_number,
            status: order.status,
            total: order.total,
            deliveryMethod: order.delivery_method,
            deliveryAddress: order.delivery_address,
            items: (order.items ?? []).map((i) => ({
                title: i.title,
                quantity: i.quantity,
                unitPrice: i.unit_price,
            })),
            deliveries: (order.deliveries ?? []).map((d) => ({ id: d.id, status: d.status })),
        };
    }
    // ── Payments (M-Pesa) ─────────────────────────────────────────────────────
    async initiateMpesaStkPush(orderId, phone) {
        const order = await Order_1.Order.findOne({
            where: { [sequelize_1.Op.or]: [{ order_number: orderId }, { id: orderId }] },
        });
        if (!order)
            throw new AppError_1.AppError(404, 'not_found', 'Order not found');
        if (order.status === 'PAID')
            throw new AppError_1.AppError(400, 'already_paid', 'Order already paid');
        const normalizedPhone = phone.replace(/\D/g, '').replace(/^0/, '254');
        const checkoutRequestId = `CHK${Date.now()}`;
        const payment = await Payment_1.Payment.create({
            order_id: order.id,
            method: 'mpesa',
            amount: order.total,
            phone: normalizedPhone,
            status: 'PENDING',
            mpesa_checkout_request_id: checkoutRequestId,
        });
        const useSandbox = !process.env.MPESA_CONSUMER_KEY;
        if (useSandbox) {
            await this.completePayment(payment.id, { receiptNumber: `MPESA${Date.now()}` });
        }
        return {
            checkoutRequestId,
            orderId: order.order_number,
            amount: order.total,
            phone: normalizedPhone,
            message: useSandbox
                ? 'M-Pesa sandbox: payment auto-completed (set MPESA_* env vars for live STK push)'
                : 'STK push initiated',
        };
    }
    async handleMpesaCallback(payload) {
        const checkoutId = String(payload.Body?.stkCallback
            ?.CheckoutRequestID ?? payload.checkoutRequestId ?? '');
        if (!checkoutId)
            return { ResultCode: 1, ResultDesc: 'Missing checkout request ID' };
        const payment = await Payment_1.Payment.findOne({ where: { mpesa_checkout_request_id: checkoutId } });
        if (!payment)
            return { ResultCode: 1, ResultDesc: 'Payment not found' };
        const resultCode = Number(payload.Body?.stkCallback?.ResultCode ?? 0);
        if (resultCode === 0) {
            const receipt = payload
                .Body?.stkCallback?.CallbackMetadata?.Item?.find((i) => i.Name === 'MpesaReceiptNumber')?.Value ??
                `MPESA${Date.now()}`;
            await this.completePayment(payment.id, { receiptNumber: String(receipt), payload });
        }
        else {
            await payment.update({ status: 'FAILED', callback_payload: payload });
        }
        return { ResultCode: 0, ResultDesc: 'Accepted' };
    }
    async completePayment(paymentId, data) {
        const payment = await Payment_1.Payment.findByPk(paymentId, { include: [Order_1.Order] });
        if (!payment)
            return;
        await payment.update({
            status: 'COMPLETED',
            mpesa_receipt_number: data.receiptNumber,
            callback_payload: data.payload,
        });
        if (payment.order) {
            await payment.order.update({ status: 'PAID' });
        }
    }
    // ── Part Requests ─────────────────────────────────────────────────────────
    async createPartRequest(userId, data) {
        const row = await PartRequest_1.PartRequest.create({
            user_id: userId,
            request_number: nextRequestNumber(),
            vehicle: data.vehicle,
            part_name: data.partName,
            description: data.description,
            vin: data.vin,
            photo_urls: data.photoUrls ?? [],
            status: 'SUBMITTED',
        });
        return this.partRequestToDto(row);
    }
    async listPartRequests(userId) {
        const where = userId ? { user_id: userId } : {};
        const rows = await PartRequest_1.PartRequest.findAll({ where, order: [['created_at', 'DESC']] });
        return rows.map((r) => this.partRequestToDto(r));
    }
    async getPartRequest(id, userId) {
        const where = {
            [sequelize_1.Op.or]: [{ id }, { request_number: id }],
        };
        if (userId)
            where.user_id = userId;
        const row = await PartRequest_1.PartRequest.findOne({
            where: where,
            include: [Quotation_1.Quotation],
        });
        if (!row)
            return null;
        return {
            ...this.partRequestToDto(row),
            quotations: (row.quotations ?? []).map((q) => this.quotationToDto(q)),
        };
    }
    partRequestToDto(r) {
        return {
            id: r.request_number,
            requestId: r.id,
            vehicle: r.vehicle,
            partName: r.part_name,
            description: r.description,
            vin: r.vin,
            photoUrls: r.photo_urls,
            status: r.status,
        };
    }
    // ── Quotations ────────────────────────────────────────────────────────────
    async createQuotation(data) {
        const request = await PartRequest_1.PartRequest.findOne({
            where: { [sequelize_1.Op.or]: [{ id: data.requestId }, { request_number: data.requestId }] },
        });
        if (!request)
            throw new AppError_1.AppError(404, 'not_found', 'Part request not found');
        const quote = await Quotation_1.Quotation.create({
            request_id: request.id,
            supplier_id: data.supplierId,
            price: data.price,
            lead_time_days: data.leadTimeDays,
            valid_until: data.validUntil,
            status: 'PENDING',
        });
        await request.update({ status: 'QUOTED' });
        return this.quotationToDto(quote);
    }
    async getQuotation(id) {
        const quote = await Quotation_1.Quotation.findByPk(id, { include: [PartRequest_1.PartRequest, Supplier_1.Supplier] });
        if (!quote)
            return null;
        return {
            ...this.quotationToDto(quote),
            request: quote.partRequest ? this.partRequestToDto(quote.partRequest) : null,
            supplier: quote.supplier
                ? { id: quote.supplier.id, name: quote.supplier.name, phone: quote.supplier.phone, email: quote.supplier.email }
                : null,
        };
    }
    async acceptQuotation(id, userId) {
        const quote = await Quotation_1.Quotation.findByPk(id, { include: [PartRequest_1.PartRequest] });
        if (!quote)
            throw new AppError_1.AppError(404, 'not_found', 'Quotation not found');
        if (quote.partRequest?.user_id !== userId)
            throw new AppError_1.AppError(403, 'forbidden', 'Not your quotation');
        if (quote.status !== 'PENDING')
            throw new AppError_1.AppError(400, 'invalid_status', 'Quotation is not pending');
        const orderNumber = nextOrderNumber();
        const order = await Order_1.Order.create({
            order_number: orderNumber,
            user_id: userId,
            status: 'PENDING_PAYMENT',
            total: quote.price,
            part_request_id: quote.request_id,
            quotation_id: quote.id,
        });
        await OrderItem_1.OrderItem.create({
            order_id: order.id,
            title: quote.partRequest?.part_name ?? 'Requested Part',
            quantity: 1,
            unit_price: quote.price,
        });
        await Delivery_1.Delivery.create({ order_id: order.id, status: 'PROCESSING' });
        await quote.update({ status: 'ACCEPTED' });
        if (quote.partRequest)
            await quote.partRequest.update({ status: 'CLOSED' });
        return { orderId: order.order_number, amount: quote.price };
    }
    async rejectQuotation(id, userId) {
        const quote = await Quotation_1.Quotation.findByPk(id, { include: [PartRequest_1.PartRequest] });
        if (!quote)
            throw new AppError_1.AppError(404, 'not_found', 'Quotation not found');
        if (quote.partRequest?.user_id !== userId)
            throw new AppError_1.AppError(403, 'forbidden', 'Not your quotation');
        await quote.update({ status: 'REJECTED' });
        return this.quotationToDto(quote);
    }
    quotationToDto(q) {
        return {
            id: q.id,
            requestId: q.request_id,
            price: q.price,
            leadTimeDays: q.lead_time_days,
            validUntil: q.valid_until,
            status: q.status,
        };
    }
    // ── Suppliers ─────────────────────────────────────────────────────────────
    async createSupplier(data) {
        const row = await Supplier_1.Supplier.create(data);
        return this.supplierToDto(row);
    }
    async listSuppliers() {
        const rows = await Supplier_1.Supplier.findAll({ order: [['name', 'ASC']] });
        return rows.map((s) => this.supplierToDto(s));
    }
    async updateSupplier(id, data) {
        const row = await Supplier_1.Supplier.findByPk(id);
        if (!row)
            return null;
        await row.update(data);
        return this.supplierToDto(row);
    }
    supplierToDto(s) {
        return { id: s.id, name: s.name, phone: s.phone, email: s.email };
    }
    // ── Deliveries ────────────────────────────────────────────────────────────
    async createDelivery(data) {
        const order = await Order_1.Order.findOne({
            where: { [sequelize_1.Op.or]: [{ order_number: data.orderId }, { id: data.orderId }] },
        });
        if (!order)
            throw new AppError_1.AppError(404, 'not_found', 'Order not found');
        const delivery = await Delivery_1.Delivery.create({ order_id: order.id, status: 'PROCESSING', notes: data.notes });
        return this.deliveryToDto(delivery);
    }
    async updateDeliveryStatus(id, status) {
        const allowed = ['PROCESSING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED'];
        const normalized = status.toUpperCase();
        if (!allowed.includes(normalized))
            throw new AppError_1.AppError(400, 'invalid_status', 'Invalid delivery status');
        const delivery = await Delivery_1.Delivery.findByPk(id, { include: [Order_1.Order] });
        if (!delivery)
            throw new AppError_1.AppError(404, 'not_found', 'Delivery not found');
        await delivery.update({ status: normalized });
        if (delivery.order) {
            const orderStatus = normalized === 'DELIVERED' ? 'DELIVERED' : normalized === 'IN_TRANSIT' ? 'IN_TRANSIT' : 'PROCESSING';
            await delivery.order.update({ status: orderStatus });
        }
        return this.deliveryToDto(delivery);
    }
    async getDelivery(id) {
        const delivery = await Delivery_1.Delivery.findByPk(id, { include: [Order_1.Order] });
        if (!delivery)
            return null;
        return {
            ...this.deliveryToDto(delivery),
            orderId: delivery.order?.order_number,
        };
    }
    deliveryToDto(d) {
        return { id: d.id, orderId: d.order_id, status: d.status, notes: d.notes };
    }
    // ── Reports ───────────────────────────────────────────────────────────────
    async getDashboard() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const ordersToday = await Order_1.Order.findAll({
            where: { createdAt: { [sequelize_1.Op.gte]: today }, status: { [sequelize_1.Op.ne]: 'CANCELLED' } },
        });
        const salesToday = ordersToday
            .filter((o) => o.status === 'PAID' || o.status === 'DELIVERED' || o.status === 'IN_TRANSIT')
            .reduce((s, o) => s + o.total, 0);
        const pendingQuotes = await PartRequest_1.PartRequest.count({ where: { status: { [sequelize_1.Op.in]: ['SUBMITTED', 'UNDER_REVIEW'] } } });
        const lowStockProducts = await InventoryRecord_1.InventoryRecord.count({
            where: { quantity: { [sequelize_1.Op.lt]: LOW_STOCK_THRESHOLD, [sequelize_1.Op.gt]: 0 } },
        });
        return {
            salesToday,
            ordersToday: ordersToday.length,
            pendingQuotes,
            lowStockProducts,
        };
    }
}
exports.MvpStore = MvpStore;
