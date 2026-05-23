"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresStore = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const sequelize_1 = require("sequelize");
const AppError_1 = require("../errors/AppError");
const db_1 = require("../database/db");
const User_1 = require("../database/models/User");
const Category_1 = require("../database/models/Category");
const Product_1 = require("../database/models/Product");
const CartItem_1 = require("../database/models/CartItem");
const CheckoutSession_1 = require("../database/models/CheckoutSession");
const SourcingRequest_1 = require("../database/models/SourcingRequest");
const SourcingQuote_1 = require("../database/models/SourcingQuote");
const SourcingAttachment_1 = require("../database/models/SourcingAttachment");
const Shipment_1 = require("../database/models/Shipment");
const MarketplaceOrder_1 = require("../database/models/MarketplaceOrder");
const AdminSourcingOrder_1 = require("../database/models/AdminSourcingOrder");
const mappers = __importStar(require("../database/mappers"));
const currency_1 = require("../utils/currency");
const LOW_STOCK_THRESHOLD = 25;
const HUB_META = [
    { code: 'CN', label: 'China', flag: '🇨🇳' },
    { code: 'AE', label: 'Dubai (UAE)', flag: '🇦🇪' },
    { code: 'KE', label: 'Kenya', flag: '🇰🇪' },
];
function productVisibility(status) {
    return { status, on_marketplace: status === 'published' };
}
function productPriceKes(p) {
    if (p.price_kes != null && Number(p.price_kes) > 0)
        return Math.round(Number(p.price_kes));
    return (0, currency_1.usdToKes)(Number(p.price_usd));
}
async function deductProductStock(product, quantity, transaction) {
    const qty = Math.max(1, Math.round(quantity));
    const available = Math.max(0, Number(product.stock) || 0);
    if (available < qty) {
        throw new AppError_1.AppError(400, 'insufficient_stock', `Not enough stock for "${product.name}"`, {
            product_id: [product.id],
            available: [String(available)],
            requested: [String(qty)],
        });
    }
    const nextStock = available - qty;
    await product.update({ stock: nextStock, low_stock: nextStock > 0 && nextStock < LOW_STOCK_THRESHOLD }, { transaction });
}
const HUB_ORIGIN_CITY = {
    CN: 'Shenzhen',
    AE: 'Dubai',
    KE: 'Nairobi',
};
function destinationCityFromAddress(address) {
    if (!address?.trim())
        return 'Nairobi';
    const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
    return parts[parts.length - 1] ?? 'Nairobi';
}
function shipmentMilestonesForStatus(status) {
    const upper = status.toUpperCase();
    const isDelivered = upper.includes('DELIVER');
    const isTransit = upper.includes('TRANSIT') || upper.includes('SHIP');
    const today = new Date().toISOString().slice(0, 10);
    return [
        {
            label: 'Order confirmed',
            detail: '',
            date: today,
            done: true,
            active: !isTransit && !isDelivered,
        },
        {
            label: 'Processing',
            detail: 'Preparing your order',
            date: today,
            done: isTransit || isDelivered,
            active: !isTransit && !isDelivered,
        },
        {
            label: 'In transit',
            detail: 'On the way to you',
            date: '',
            done: isTransit || isDelivered,
            active: isTransit && !isDelivered,
        },
        {
            label: 'Delivered',
            detail: 'Order completed',
            date: '',
            done: isDelivered,
            active: isDelivered,
        },
    ];
}
async function ensureOrderShipment(order, destinationCity, transaction) {
    const trackingId = order.tracking_id ?? order.order_number;
    const originCity = HUB_ORIGIN_CITY[order.origin_flag] ?? order.origin_flag;
    let shipment = await Shipment_1.Shipment.findOne({ where: { tracking_id: trackingId }, transaction });
    if (!shipment) {
        const statusLabel = order.status.toUpperCase().includes('DELIVER')
            ? 'Delivered'
            : order.status.toUpperCase().includes('TRANSIT')
                ? 'In transit'
                : 'Processing';
        shipment = await Shipment_1.Shipment.create({
            tracking_id: trackingId,
            current_status: statusLabel,
            origin_city: originCity,
            destination_city: destinationCity,
            vessel: '',
            milestones: shipmentMilestonesForStatus(order.status),
        }, { transaction });
    }
    else {
        const milestones = shipment.milestones;
        const isAutoTemplate = shipment.vessel === 'Dubiken Logistics' ||
            milestones?.some((m) => m.detail === 'Payment received');
        if (isAutoTemplate) {
            await shipment.update({
                vessel: '',
                milestones: shipmentMilestonesForStatus(order.status),
            }, { transaction });
        }
    }
    if (!order.tracking_id) {
        await order.update({ tracking_id: trackingId }, { transaction });
    }
}
function paginate(items, page, pageSize) {
    const p = Math.max(1, page);
    const ps = Math.max(1, pageSize);
    const start = (p - 1) * ps;
    return { data: items.slice(start, start + ps), meta: { page: p, page_size: ps, total: items.length } };
}
function applyKesPricing(priceKes, compareAtKes) {
    const pk = Math.max(1, Math.round(Number(priceKes)));
    const compareRaw = compareAtKes != null && Number.isFinite(Number(compareAtKes))
        ? Math.round(Number(compareAtKes))
        : null;
    const compare = compareRaw != null && compareRaw > pk ? compareRaw : null;
    return {
        price_kes: pk,
        compare_at_price_kes: compare,
        price_usd: (0, currency_1.kesToUsd)(pk),
        original_price: compare != null ? (0, currency_1.kesToUsd)(compare) : null,
        currency_ke: (0, currency_1.formatKshLabelFromKes)(pk),
        currency_ae: (0, currency_1.formatKshLabelFromKes)(pk),
    };
}
/** All application data access via PostgreSQL */
class PostgresStore {
    constructor() {
        this.inventoryKpis = {
            total_active_products: 0,
            new_this_week: 0,
            total_inventory_value: '$2.4M',
            hubs_label: 'Across 3 Hubs',
            low_stock_count: 0,
            hub_counts: [],
        };
    }
    async init() {
        await this.migrateProductStatus();
        await this.syncStorefrontFromInventory();
        await this.refreshInventoryKpis();
    }
    /** Align status with legacy on_marketplace after schema migrations */
    async migrateProductStatus() {
        await Product_1.Product.update({ status: 'published' }, { where: { on_marketplace: true } });
        await Product_1.Product.update({ status: 'draft', on_marketplace: false }, { where: { on_marketplace: false } });
    }
    /** Publish inventory to storefront (auto on boot if none published; force via admin) */
    async syncStorefrontFromInventory(options) {
        const total = await Product_1.Product.count();
        const publishedBefore = await Product_1.Product.count({ where: { status: 'published' } });
        const shouldPublish = options?.force || (total > 0 && publishedBefore === 0);
        if (shouldPublish && total > 0) {
            await Product_1.Product.update({ ...productVisibility('published'), marketplace_cta: 'cart' }, { where: options?.force ? {} : { status: 'draft' } });
            console.log(`Storefront: published ${total} product(s) to marketplace${options?.force ? ' (manual sync)' : ''}`);
        }
        const published_count = await Product_1.Product.count({ where: { status: 'published' } });
        return { published_count, total_products: total };
    }
    async findUserByEmail(email) {
        const u = await User_1.User.findOne({ where: { email: { [sequelize_1.Op.iLike]: email } } });
        return u ? mappers.userToDomain(u) : undefined;
    }
    async getUser(id) {
        const u = await User_1.User.findByPk(id);
        return u ? mappers.userToDomain(u) : undefined;
    }
    async createUser(data) {
        const row = await User_1.User.create({
            email: data.email,
            password: await bcrypt_1.default.hash(data.password, 10),
            name: data.name.trim(),
            company: data.company?.trim() || '',
            role: 'buyer',
            is_active: true,
        });
        return mappers.userToDomain(row);
    }
    toPublicUser(u) {
        return { id: u.id, email: u.email, name: u.name, company: u.company, role: u.role };
    }
    async getProduct(id) {
        const p = await Product_1.Product.findByPk(id);
        return p ? mappers.productToDto(p) : undefined;
    }
    async getRelatedProducts(excludeId, limit) {
        const current = await Product_1.Product.findByPk(excludeId);
        if (!current)
            return [];
        const picked = [];
        const pickedIds = () => [excludeId, ...picked.map((p) => p.id)];
        const fetchTier = async (extra, need) => {
            if (need <= 0)
                return;
            const rows = await Product_1.Product.findAll({
                where: {
                    status: 'published',
                    id: { [sequelize_1.Op.notIn]: pickedIds() },
                    ...extra,
                },
                limit: need,
                order: [['updatedAt', 'DESC']],
            });
            picked.push(...rows);
        };
        const category = current.category?.trim();
        const origin = current.origin;
        if (category && origin) {
            await fetchTier({ category, origin }, limit);
        }
        if (picked.length < limit && category) {
            await fetchTier({ category }, limit - picked.length);
        }
        if (picked.length < limit && origin) {
            await fetchTier({ origin }, limit - picked.length);
        }
        if (picked.length < limit) {
            await fetchTier({}, limit - picked.length);
        }
        return picked.slice(0, limit).map((p) => ({
            id: p.id,
            name: p.name,
            price: Number(p.price_usd),
            price_kes: (0, currency_1.formatKshLabelFromKes)(productPriceKes(p)),
            origin: p.origin,
            image_url: p.image_url,
            stock: Math.max(0, Number(p.stock) || 0),
        }));
    }
    async listMarketplace(filters) {
        const page = filters.page ?? 1;
        const pageSize = filters.page_size ?? 24;
        const hubFilter = filters.hub && filters.hub !== 'all' ? filters.hub : undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const buildWhere = (marketplaceOnly) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const where = marketplaceOnly ? { status: 'published' } : {};
            if (hubFilter)
                where.origin = hubFilter;
            if (filters.category)
                where.category = filters.category;
            if (filters.search) {
                where[sequelize_1.Op.or] = [
                    { name: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                    { vendor: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                    { brand: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                    { category: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                    { sku: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                ];
            }
            return where;
        };
        let rows = await Product_1.Product.findAll({
            where: buildWhere(true),
            order: [['updated_at', 'DESC']],
        });
        // Only broaden when browsing all hubs — never ignore an explicit hub filter
        if (rows.length === 0 &&
            !hubFilter &&
            !filters.search &&
            !filters.category) {
            rows = await Product_1.Product.findAll({
                where: buildWhere(false),
                order: [['updated_at', 'DESC']],
            });
        }
        return paginate(rows.map(mappers.productToMarketplace), page, pageSize);
    }
    async listStorefrontCategories() {
        let rows = await Category_1.Category.findAll({
            where: { status: 'published' },
            order: [['name', 'ASC']],
        });
        if (rows.length === 0) {
            rows = await Category_1.Category.findAll({ order: [['name', 'ASC']], limit: 8 });
        }
        const result = [];
        for (const c of rows) {
            const product_count = await Product_1.Product.count({
                where: { category: c.name, status: 'published' },
            });
            const samples = await Product_1.Product.findAll({
                where: { category: c.name, status: 'published' },
                limit: 4,
                order: [['updated_at', 'DESC']],
            });
            result.push({
                id: c.id,
                name: c.name,
                origin: c.origins[0] ?? 'KE',
                product_count: product_count > 0 ? product_count : c.total_skus,
                image_url: c.image_url,
                sample_products: samples.map((p) => ({
                    id: p.id,
                    name: p.name,
                    image_url: p.image_url,
                    price: (0, currency_1.formatKshLabelFromKes)(productPriceKes(p)),
                })),
            });
        }
        return result;
    }
    async getHomeFeed() {
        const categories = await this.listStorefrontCategories();
        const marketplace = await this.listMarketplace({ page: 1, page_size: 12 });
        return { categories, products: marketplace.data, meta: marketplace.meta };
    }
    async getCart(userId) {
        const rows = await CartItem_1.CartItem.findAll({
            where: { user_id: userId },
            include: [Product_1.Product],
        });
        const items = rows.map(mappers.cartItemToDto);
        const item_count = items.reduce((s, i) => s + i.quantity, 0);
        const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price_kes, 0);
        return { items, item_count, subtotal };
    }
    async addCartItem(userId, productId, quantity) {
        const product = await Product_1.Product.findByPk(productId);
        if (!product)
            return null;
        const existing = await CartItem_1.CartItem.findOne({ where: { user_id: userId, product_id: productId } });
        if (existing) {
            await existing.update({ quantity: existing.quantity + quantity });
        }
        else {
            await CartItem_1.CartItem.create({ user_id: userId, product_id: productId, quantity });
        }
        return this.getCart(userId);
    }
    async updateCartItem(userId, lineId, quantity) {
        const row = await CartItem_1.CartItem.findOne({ where: { id: lineId, user_id: userId } });
        if (!row)
            return null;
        if (quantity <= 0)
            await row.destroy();
        else
            await row.update({ quantity });
        return this.getCart(userId);
    }
    async removeCartItem(userId, lineId) {
        await CartItem_1.CartItem.destroy({ where: { id: lineId, user_id: userId } });
        return this.getCart(userId);
    }
    buildCheckoutSummaryKes(subtotalKes) {
        const subtotal = Math.round(subtotalKes);
        return {
            subtotal,
            shipping: 0,
            customs: 0,
            insurance: 0,
            total: subtotal,
            currency: 'KES',
        };
    }
    async createCheckoutShipping(userId, shipping) {
        const cart = await this.getCart(userId);
        const summary = this.buildCheckoutSummaryKes(cart.subtotal);
        const session = await CheckoutSession_1.CheckoutSession.create({ user_id: userId, shipping, summary });
        return { checkout_id: session.id, shipping, summary };
    }
    async completeGuestCheckout(body) {
        if (!body.items.length)
            return null;
        const qtyByProduct = new Map();
        for (const line of body.items) {
            const id = line.product_id;
            qtyByProduct.set(id, (qtyByProduct.get(id) ?? 0) + Math.max(1, line.quantity));
        }
        const shipping = body.shipping;
        const buyerAddress = [shipping.address, shipping.city, shipping.region].filter(Boolean).join(', ');
        const eta = new Date();
        eta.setDate(eta.getDate() + 14);
        const etaLabel = eta.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
        try {
            return await db_1.db.transaction(async (transaction) => {
                const lines = [];
                for (const [productId, quantity] of qtyByProduct) {
                    const product = await Product_1.Product.findByPk(productId, { transaction });
                    if (!product) {
                        throw new AppError_1.AppError(404, 'not_found', 'Product not found', {
                            product_id: [productId],
                        });
                    }
                    await deductProductStock(product, quantity, transaction);
                    const unitKes = productPriceKes(product);
                    lines.push({ product, quantity, lineKes: unitKes * quantity });
                }
                const created = [];
                for (const item of lines) {
                    const orderNumber = `DBK-${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 90)}`;
                    const row = await MarketplaceOrder_1.MarketplaceOrder.create({
                        user_id: null,
                        buyer_name: shipping.full_name,
                        buyer_phone: shipping.phone,
                        buyer_email: shipping.email ?? null,
                        buyer_address: buyerAddress,
                        order_number: orderNumber,
                        tracking_id: orderNumber,
                        title: item.quantity > 1
                            ? `${item.product.name} (×${item.quantity})`
                            : item.product.name,
                        vendor: 'Dubiken Marketplace',
                        origin_flag: item.product.origin,
                        image_url: item.product.image_url,
                        status: 'PROCESSING',
                        status_icon: 'processing',
                        progress_step: 1,
                        price_kes: (0, currency_1.formatKshLabelFromKes)(item.lineKes),
                        price_secondary: '',
                        date_label: 'ETA',
                        date_value: etaLabel,
                        primary_action: 'Track Package',
                        secondary_action: 'Order Details',
                        primary_style: 'navy',
                    }, { transaction });
                    await ensureOrderShipment(row, destinationCityFromAddress(buyerAddress), transaction);
                    created.push({ order_id: row.id, order_number: row.order_number });
                }
                await this.refreshInventoryKpis();
                const first = created[0];
                return first
                    ? { order_id: first.order_id, order_number: first.order_number, orders: created }
                    : null;
            });
        }
        catch (err) {
            if (err instanceof AppError_1.AppError)
                throw err;
            return null;
        }
    }
    async completeCheckout(checkoutId) {
        const session = await CheckoutSession_1.CheckoutSession.findByPk(checkoutId);
        if (!session?.user_id)
            return null;
        const cartRows = await CartItem_1.CartItem.findAll({
            where: { user_id: session.user_id },
            include: [Product_1.Product],
        });
        if (cartRows.length === 0)
            return null;
        const eta = new Date();
        eta.setDate(eta.getDate() + 14);
        const etaLabel = eta.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
        const user = await User_1.User.findByPk(session.user_id);
        const ship = session.shipping;
        const buyerAddress = [ship.address, ship.city, ship.region].filter(Boolean).join(', ');
        try {
            return await db_1.db.transaction(async (transaction) => {
                const qtyByProduct = new Map();
                for (const row of cartRows) {
                    const product = row.product;
                    if (!product)
                        continue;
                    const existing = qtyByProduct.get(row.product_id);
                    if (existing) {
                        existing.quantity += row.quantity;
                    }
                    else {
                        qtyByProduct.set(row.product_id, { product, quantity: row.quantity });
                    }
                }
                const created = [];
                for (const { product, quantity } of qtyByProduct.values()) {
                    await deductProductStock(product, quantity, transaction);
                    const unitKes = productPriceKes(product);
                    const lineKes = unitKes * quantity;
                    const orderNumber = `DBK-${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 90)}`;
                    const row = await MarketplaceOrder_1.MarketplaceOrder.create({
                        user_id: session.user_id,
                        buyer_name: ship.full_name ?? user?.name ?? null,
                        buyer_phone: ship.phone ?? null,
                        buyer_email: ship.email ?? user?.email ?? null,
                        buyer_address: buyerAddress || null,
                        order_number: orderNumber,
                        tracking_id: orderNumber,
                        title: quantity > 1 ? `${product.name} (×${quantity})` : product.name,
                        vendor: 'Dubiken Marketplace',
                        origin_flag: product.origin,
                        image_url: product.image_url,
                        status: 'PROCESSING',
                        status_icon: 'processing',
                        progress_step: 1,
                        price_kes: (0, currency_1.formatKshLabelFromKes)(lineKes),
                        price_secondary: '',
                        date_label: 'ETA',
                        date_value: etaLabel,
                        primary_action: 'Track Package',
                        secondary_action: 'Order Details',
                        primary_style: 'navy',
                    }, { transaction });
                    await ensureOrderShipment(row, destinationCityFromAddress(buyerAddress), transaction);
                    created.push({ order_id: row.id, order_number: row.order_number });
                }
                await CartItem_1.CartItem.destroy({ where: { user_id: session.user_id }, transaction });
                await session.destroy({ transaction });
                await this.refreshInventoryKpis();
                const first = created[0];
                return first
                    ? { order_id: first.order_id, order_number: first.order_number, orders: created }
                    : null;
            });
        }
        catch (err) {
            if (err instanceof AppError_1.AppError)
                throw err;
            return null;
        }
    }
    async getUserSourcingDashboard(userId) {
        const requests = await SourcingRequest_1.SourcingRequest.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']],
        });
        const list = requests.map(mappers.sourcingToUserList);
        const pending_quotes = list.filter((r) => ['PENDING', 'PENDING QUOTE', 'pending_quote', 'pending'].includes(String(r.status).toUpperCase())).length;
        const procured = list.reduce((sum, r) => sum + (0, currency_1.parseKesFromLabel)(r.price), 0);
        return {
            summary: {
                active: list.length,
                pending_quotes,
                procured_total: list.length ? (0, currency_1.formatCompactKes)(procured) : 'KSh 0',
            },
            requests: list,
        };
    }
    async getUserSourcingDetail(id) {
        const sr = await SourcingRequest_1.SourcingRequest.findByPk(id, {
            include: [SourcingQuote_1.SourcingQuote, SourcingAttachment_1.SourcingAttachment],
        });
        if (!sr || !sr.user_id)
            return null;
        return mappers.sourcingToUserDetail(sr);
    }
    async createUserSourcingRequest(userId, body) {
        const user = await User_1.User.findByPk(userId);
        const requestNumber = `DBK-${Math.floor(90000 + Math.random() * 9999)}`;
        const quantityLabel = `${body.quantity} ${body.unit}`;
        const county = String(body.county ?? body.destination ?? '').trim();
        const deliveryAddress = String(body.delivery_address ?? '').trim();
        const budgetKsh = (0, currency_1.formatKshFromInput)(String(body.budget));
        const originCode = String(body.origin);
        const sr = await SourcingRequest_1.SourcingRequest.create({
            user_id: userId,
            request_number: requestNumber,
            product_title: String(body.product_name),
            description: String(body.description),
            origin: originCode,
            destination: county,
            destination_label: 'Kenya',
            requester_location: deliveryAddress,
            quantity: quantityLabel,
            unit: String(body.unit),
            target_date: String(body.target_date),
            shipping_method: String(body.shipping_method),
            budget: budgetKsh,
            status: 'pending',
            market: 'KE',
            user_status: 'PENDING',
            status_variant: 'gray',
            client_name: user?.name,
            client_initials: user?.name
                ?.split(' ')
                .map((w) => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase(),
            budget_total: budgetKsh,
            budget_subtitle: 'Target Budget',
            regional_targets: [
                { code: originCode, label: originCode },
                { code: 'KE', label: county },
            ],
            reference_images: [],
        });
        return mappers.sourcingToUserList(sr);
    }
    async listAdminSourcing(filters) {
        const where = {};
        if (filters.market && filters.market !== 'all')
            where.market = filters.market;
        if (filters.status?.length)
            where.status = { [sequelize_1.Op.in]: filters.status };
        const rows = await SourcingRequest_1.SourcingRequest.findAll({
            where: where,
            order: [['created_at', 'DESC']],
        });
        return paginate(rows.map(mappers.sourcingToAdminList), filters.page ?? 1, filters.page_size ?? 10);
    }
    async getAdminSourcingDetail(id) {
        const sr = await SourcingRequest_1.SourcingRequest.findByPk(id, {
            include: [SourcingQuote_1.SourcingQuote, SourcingAttachment_1.SourcingAttachment],
        });
        if (!sr)
            return null;
        return mappers.sourcingToAdminDetail(sr);
    }
    async saveOfficialQuote(requestId, input) {
        const sr = await SourcingRequest_1.SourcingRequest.findByPk(requestId);
        if (!sr)
            return null;
        await SourcingQuote_1.SourcingQuote.destroy({ where: { sourcing_request_id: requestId, official: true } });
        const quote = await SourcingQuote_1.SourcingQuote.create({
            sourcing_request_id: requestId,
            unit_price: (0, currency_1.formatKshFromInput)(input.unit_price),
            shipping_cost: input.shipping_cost ? (0, currency_1.formatKshFromInput)(input.shipping_cost) : undefined,
            lead_time: `${input.lead_time_days.trim()} Days`,
            shipment: input.transport.trim(),
            notes: input.notes?.trim() ?? '',
            official: true,
        });
        if (sr.status === 'pending')
            await sr.update({ status: 'quoted' });
        if (sr.user_id) {
            await sr.update({ user_status: 'QUOTED', status_variant: 'orange' });
        }
        return { quote: mappers.quoteToDto(quote), request_status: sr.status };
    }
    async listCategories() {
        const rows = await Category_1.Category.findAll({ order: [['name', 'ASC']] });
        return { data: rows.map(mappers.categoryToAdmin) };
    }
    async getCategory(id) {
        const c = await Category_1.Category.findByPk(id);
        return c ? mappers.categoryToAdmin(c) : null;
    }
    async upsertCategory(input) {
        if (input.id) {
            const c = await Category_1.Category.findByPk(input.id);
            if (!c)
                throw new Error('Category not found');
            await c.update(input);
            return mappers.categoryToAdmin(c);
        }
        const c = await Category_1.Category.create(input);
        return mappers.categoryToAdmin(c);
    }
    async refreshInventoryKpis() {
        this.inventoryKpis = await this.loadInventoryKpis();
    }
    async loadInventoryKpis() {
        const total = await Product_1.Product.count();
        const published = await Product_1.Product.count({ where: { status: 'published' } });
        const low = await Product_1.Product.count({ where: { low_stock: true, status: 'published' } });
        const hub_counts = await Promise.all(HUB_META.map(async (h) => {
            const rows = await Product_1.Product.findAll({
                where: { origin: h.code },
                attributes: ['stock', 'status'],
            });
            return {
                hub: h.code,
                label: h.label,
                flag: h.flag,
                product_count: rows.length,
                published_count: rows.filter((r) => r.status === 'published').length,
                stock_units: rows.reduce((sum, r) => sum + Math.max(0, Number(r.stock) || 0), 0),
            };
        }));
        const hubSummary = hub_counts
            .filter((h) => h.published_count > 0)
            .map((h) => `${h.label}: ${h.published_count}`)
            .join(' · ');
        const publishedProducts = await Product_1.Product.findAll({ where: { status: 'published' } });
        let inventoryKes = 0;
        for (const p of publishedProducts) {
            inventoryKes += productPriceKes(p) * Math.max(0, Number(p.stock) || 0);
        }
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const new_this_week = await Product_1.Product.count({
            where: { createdAt: { [sequelize_1.Op.gte]: weekAgo } },
        });
        return {
            total_active_products: published,
            new_this_week,
            total_inventory_value: (0, currency_1.formatCompactKes)(inventoryKes),
            hubs_label: hubSummary || 'Across 3 Hubs',
            low_stock_count: low,
            hub_counts,
        };
    }
    async listInventory(filters) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where = {};
        if (filters.search) {
            where[sequelize_1.Op.or] = [
                { name: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                { sku: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
            ];
        }
        const rows = await Product_1.Product.findAll({ where, order: [['name', 'ASC']] });
        return paginate(rows.map(mappers.productToInventory), filters.page ?? 1, filters.page_size ?? 20);
    }
    async createInventoryProduct(body) {
        const specs = body.attributes?.length
            ? Object.fromEntries(body.attributes.map((a) => [a.feature, a.value]))
            : {};
        const pricing = applyKesPricing(body.price_kes, body.compare_at_price_kes);
        const listingStatus = body.status ?? 'draft';
        const row = await Product_1.Product.create({
            sku: body.sku,
            name: body.name,
            description: body.description ?? body.name,
            brand: body.brand,
            category: body.category,
            origin: body.primary_origin,
            ...pricing,
            image_url: body.image_url,
            images: body.images ?? [body.image_url],
            specs,
            stock: body.stock,
            min_order: body.min_order != null && body.min_order > 0 ? body.min_order : 1,
            low_stock: body.stock < 25,
            ...productVisibility(listingStatus),
            marketplace_cta: 'cart',
            vendor: body.brand?.trim() || undefined,
        });
        await this.refreshInventoryKpis();
        return {
            id: row.id,
            sku: row.sku,
            name: row.name,
            marketplace_price: pricing.currency_ke,
            stock: row.stock,
            low_stock: row.low_stock,
        };
    }
    async getInventoryProduct(id) {
        const row = await Product_1.Product.findByPk(id);
        if (!row)
            return null;
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
            primary_origin: row.origin,
            price_kes: row.price_kes != null && Number(row.price_kes) > 0
                ? Math.round(Number(row.price_kes))
                : (0, currency_1.usdToKes)(Number(row.price_usd)),
            compare_at_price_kes: row.compare_at_price_kes != null && Number(row.compare_at_price_kes) > 0
                ? Math.round(Number(row.compare_at_price_kes))
                : row.original_price != null
                    ? (0, currency_1.usdToKes)(Number(row.original_price))
                    : null,
            stock: row.stock,
            image_url: row.image_url,
            images,
            gallery_images: gallery,
            attributes: Object.entries(specs).map(([feature, value]) => ({ feature, value })),
            status: row.status === 'published' || row.status === 'draft'
                ? row.status
                : row.on_marketplace
                    ? 'published'
                    : 'draft',
            on_marketplace: row.on_marketplace,
            marketplace_cta: row.marketplace_cta,
            min_order: row.min_order ?? 1,
        };
    }
    async updateInventoryProduct(id, body) {
        const row = await Product_1.Product.findByPk(id);
        if (!row)
            return null;
        const updates = {};
        if (body.name !== undefined)
            updates.name = body.name;
        if (body.sku !== undefined)
            updates.sku = body.sku;
        if (body.category !== undefined)
            updates.category = body.category;
        if (body.description !== undefined)
            updates.description = body.description;
        if (body.brand !== undefined) {
            updates.brand = body.brand;
            updates.vendor = body.brand || row.vendor;
        }
        if (body.primary_origin !== undefined)
            updates.origin = body.primary_origin;
        if (body.price_kes !== undefined) {
            const currentCompare = body.compare_at_price_kes !== undefined
                ? body.compare_at_price_kes
                : row.compare_at_price_kes ?? (row.original_price != null ? (0, currency_1.usdToKes)(Number(row.original_price)) : null);
            Object.assign(updates, applyKesPricing(body.price_kes, currentCompare));
        }
        else if (body.compare_at_price_kes !== undefined) {
            const currentPrice = row.price_kes != null && Number(row.price_kes) > 0
                ? Number(row.price_kes)
                : (0, currency_1.usdToKes)(Number(row.price_usd));
            Object.assign(updates, applyKesPricing(currentPrice, body.compare_at_price_kes));
        }
        if (body.image_url !== undefined)
            updates.image_url = body.image_url;
        if (body.images !== undefined)
            updates.images = body.images;
        if (body.stock !== undefined) {
            updates.stock = body.stock;
            updates.low_stock = body.stock < 25;
        }
        if (body.min_order !== undefined) {
            updates.min_order = body.min_order > 0 ? body.min_order : 1;
        }
        if (body.status !== undefined) {
            Object.assign(updates, productVisibility(body.status));
        }
        else if (body.on_marketplace !== undefined) {
            Object.assign(updates, productVisibility(body.on_marketplace ? 'published' : 'draft'));
        }
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
            marketplace_price: (0, currency_1.formatKshLabelFromKes)(productPriceKes(row)),
            stock: row.stock,
            low_stock: row.low_stock,
        };
    }
    async getShipment(trackingId) {
        const id = trackingId.trim().replace(/^#+/, '').trim();
        if (!id)
            return null;
        const s = await Shipment_1.Shipment.findOne({ where: { tracking_id: id } });
        return s ? mappers.shipmentToDto(s) : null;
    }
    async listShipments() {
        const rows = await Shipment_1.Shipment.findAll({ order: [['updated_at', 'DESC']] });
        return rows.map((s) => mappers.shipmentToDto(s));
    }
    async addSourcingAttachment(requestId, data) {
        await SourcingAttachment_1.SourcingAttachment.create({
            sourcing_request_id: requestId,
            ...data,
        });
    }
    async getAdminDashboard() {
        const active_requests = await SourcingRequest_1.SourcingRequest.count({
            where: { status: { [sequelize_1.Op.in]: ['pending', 'quoted', 'shipping'] } },
        });
        const pending_quotes = await SourcingRequest_1.SourcingRequest.count({ where: { status: 'pending' } });
        const delayed_shipments = await Shipment_1.Shipment.count({
            where: { current_status: { [sequelize_1.Op.iLike]: '%transit%' } },
        });
        const recent = await SourcingRequest_1.SourcingRequest.findAll({
            order: [['updated_at', 'DESC']],
            limit: 6,
        });
        const statusLabel = {
            pending: { label: 'Pending Quote', variant: 'orange' },
            quoted: { label: 'Quoted', variant: 'blue' },
            shipping: { label: 'Shipping', variant: 'blue' },
            delivered: { label: 'Delivered', variant: 'blue' },
        };
        const sourcing_rows = recent.map((sr) => {
            const tag = statusLabel[sr.status] ?? { label: sr.status, variant: 'orange' };
            return {
                id: sr.id,
                origin: sr.origin,
                destination: sr.market,
                product_title: sr.product_title,
                quantity: sr.quantity ?? '—',
                vendor: sr.client_name ?? '—',
                status_tags: [{ label: tag.label, variant: tag.variant }],
                time_ago: timeAgo(sr.updatedAt ?? sr.createdAt),
                primary_action: { label: 'View Details', style: 'outline' },
            };
        });
        const shipmentRows = await Shipment_1.Shipment.findAll({ limit: 3, order: [['updated_at', 'DESC']] });
        const logistics = shipmentRows.map((s) => ({
            tracking_id: s.tracking_id,
            mode: 'Sea',
            status: s.current_status.toUpperCase().includes('TRANSIT') ? 'TRANSIT' : 'CUSTOMS',
            status_variant: 'orange',
            route_from: s.origin_city,
            route_to: s.destination_city,
            eta: s.milestones?.find((m) => !m.done)?.date ?? '—',
        }));
        const marketplaceOrders = await MarketplaceOrder_1.MarketplaceOrder.findAll();
        const now = Date.now();
        const periodMs = 28 * 24 * 60 * 60 * 1000;
        const currentStart = now - periodMs;
        const prevStart = now - 2 * periodMs;
        const revenueInRange = (start, end) => marketplaceOrders
            .filter((o) => {
            const t = o.createdAt?.getTime() ?? 0;
            return t >= start && t < end && !orderIsCancelled(o.status);
        })
            .reduce((sum, o) => sum + (0, currency_1.parseKesFromLabel)(o.price_kes), 0);
        const currentRevenue = revenueInRange(currentStart, now);
        const prevRevenue = revenueInRange(prevStart, currentStart);
        const openOrders = marketplaceOrders.filter((o) => !orderIsCancelled(o.status));
        const deliveredCount = openOrders.filter((o) => o.status.toUpperCase().includes('DELIVER')).length;
        const otd_percent = openOrders.length > 0 ? Math.round((deliveredCount / openOrders.length) * 100) : 0;
        const staleMs = 14 * 24 * 60 * 60 * 1000;
        const staleOrders = marketplaceOrders.filter((o) => {
            if (orderIsCancelled(o.status) || o.status.toUpperCase().includes('DELIVER')) {
                return false;
            }
            const age = now - (o.createdAt?.getTime() ?? now);
            return age > staleMs;
        }).length;
        const delayedInShipments = await Shipment_1.Shipment.count({
            where: {
                [sequelize_1.Op.or]: [
                    { current_status: { [sequelize_1.Op.iLike]: '%delay%' } },
                    { current_status: { [sequelize_1.Op.iLike]: '%hold%' } },
                ],
            },
        });
        return {
            kpis: {
                /** Marketplace order revenue in KES (last 28 days) — field name kept for API compat */
                global_sales_usd: currentRevenue,
                global_sales_change: (0, currency_1.formatPeriodChange)(currentRevenue, prevRevenue),
                active_requests,
                pending_quotes,
                otd_percent,
                delayed_shipments: staleOrders + delayedInShipments,
            },
            sourcing_rows,
            logistics,
        };
    }
    async listAdminSourcingOrders() {
        const rows = await AdminSourcingOrder_1.AdminSourcingOrder.findAll({ order: [['created_at', 'DESC']] });
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
    async listUserMarketplaceOrders(userId) {
        const rows = await MarketplaceOrder_1.MarketplaceOrder.findAll({
            where: userId ? { user_id: userId } : undefined,
            order: [['created_at', 'DESC']],
        });
        for (const row of rows) {
            if (!row.tracking_id) {
                await ensureOrderShipment(row, destinationCityFromAddress(row.buyer_address));
                await row.reload();
            }
        }
        return rows.map(mappers.marketplaceOrderToDto);
    }
    async getUserMarketplaceOrder(userId, orderId) {
        const row = await MarketplaceOrder_1.MarketplaceOrder.findOne({
            where: { id: orderId, user_id: userId },
        });
        if (!row)
            return null;
        if (!row.tracking_id) {
            await ensureOrderShipment(row, destinationCityFromAddress(row.buyer_address));
            await row.reload();
        }
        const trackingId = row.tracking_id ?? row.order_number;
        const shipment = await Shipment_1.Shipment.findOne({ where: { tracking_id: trackingId } });
        return {
            order: mappers.marketplaceOrderToDto(row),
            shipment: shipment ? mappers.shipmentToDto(shipment) : null,
        };
    }
    async listAdminMarketplaceOrders() {
        const rows = await MarketplaceOrder_1.MarketplaceOrder.findAll({
            include: [{ model: User_1.User, attributes: ['name', 'email', 'company'] }],
            order: [['created_at', 'DESC']],
        });
        return rows.map((o) => {
            const contactParts = [o.buyer_phone, o.buyer_email, o.buyer_address].filter(Boolean);
            return {
                ...mappers.marketplaceOrderToDto(o),
                customer_name: o.buyer_name ?? o.user?.name ?? o.user?.email ?? 'Guest buyer',
                customer_detail: contactParts.length > 0
                    ? contactParts.join(' · ')
                    : (o.user?.company ?? o.user?.email ?? ''),
            };
        });
    }
    async updateMarketplaceOrderStatus(id, status) {
        const row = await MarketplaceOrder_1.MarketplaceOrder.findByPk(id);
        if (!row)
            return null;
        const normalized = status.trim().toUpperCase();
        const allowed = ['PROCESSING', 'IN TRANSIT', 'DELIVERED', 'CANCELLED'];
        if (!allowed.includes(normalized))
            return null;
        let status_icon = 'processing';
        let progress_step = 1;
        if (normalized === 'DELIVERED') {
            status_icon = 'delivered';
            progress_step = 4;
        }
        else if (normalized === 'IN TRANSIT') {
            status_icon = 'transit';
            progress_step = 3;
        }
        else if (normalized === 'CANCELLED') {
            progress_step = 0;
        }
        await row.update({ status: normalized, status_icon, progress_step });
        const trackingId = row.tracking_id ?? row.order_number;
        const shipment = await Shipment_1.Shipment.findOne({ where: { tracking_id: trackingId } });
        if (shipment) {
            const statusLabel = normalized === 'DELIVERED'
                ? 'Delivered'
                : normalized === 'IN TRANSIT'
                    ? 'In transit'
                    : normalized === 'CANCELLED'
                        ? 'Cancelled'
                        : 'Processing';
            await shipment.update({
                current_status: statusLabel,
                milestones: shipmentMilestonesForStatus(normalized),
            });
        }
        else if (normalized !== 'CANCELLED') {
            await ensureOrderShipment(row, destinationCityFromAddress(row.buyer_address));
        }
        const contactParts = [row.buyer_phone, row.buyer_email, row.buyer_address].filter(Boolean);
        const user = row.user_id ? await User_1.User.findByPk(row.user_id) : null;
        return {
            ...mappers.marketplaceOrderToDto(row),
            customer_name: row.buyer_name ?? user?.name ?? user?.email ?? 'Guest buyer',
            customer_detail: contactParts.length > 0
                ? contactParts.join(' · ')
                : (user?.company ?? user?.email ?? ''),
        };
    }
    async listUserShipments(userId) {
        const orders = await MarketplaceOrder_1.MarketplaceOrder.findAll({
            where: { user_id: userId },
            attributes: ['tracking_id'],
        });
        const trackingIds = [
            ...new Set(orders.map((o) => o.tracking_id).filter((id) => !!id)),
        ];
        if (trackingIds.length === 0)
            return [];
        const rows = await Shipment_1.Shipment.findAll({ where: { tracking_id: trackingIds } });
        return rows.map(mappers.shipmentToDto);
    }
    async getUserShipment(userId, trackingId) {
        const id = trackingId.trim().replace(/^#+/, '').trim();
        if (!id)
            return null;
        const order = await MarketplaceOrder_1.MarketplaceOrder.findOne({
            where: {
                user_id: userId,
                [sequelize_1.Op.or]: [{ tracking_id: id }, { order_number: id }],
            },
        });
        if (!order)
            return null;
        if (!order.tracking_id) {
            await ensureOrderShipment(order, destinationCityFromAddress(order.buyer_address));
            await order.reload();
        }
        return this.getShipment(order.tracking_id ?? order.order_number);
    }
    async listExploreCategoriesPaginated(page = 1, pageSize = 12) {
        const categories = await this.listStorefrontCategories();
        return paginate(categories, page, pageSize);
    }
    async getAdminAnalytics() {
        const orders = await MarketplaceOrder_1.MarketplaceOrder.findAll({ order: [['created_at', 'ASC']] });
        const products = await Product_1.Product.findAll({
            attributes: ['name', 'category'],
        });
        const now = Date.now();
        const weekMs = 7 * 24 * 60 * 60 * 1000;
        const hubRevenue = (list, flag) => list
            .filter((o) => o.origin_flag === flag)
            .reduce((sum, o) => sum + (0, currency_1.parseKesFromLabel)(o.price_kes), 0);
        const weekly_volume = [0, 1, 2, 3].map((w) => {
            const end = now - (3 - w) * weekMs;
            const start = end - weekMs;
            const inWeek = orders.filter((o) => {
                const t = o.createdAt?.getTime() ?? 0;
                return t >= start && t < end && !orderIsCancelled(o.status);
            });
            const weekStart = new Date(start);
            return {
                week: weekStart.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }),
                kenya: hubRevenue(inWeek, 'KE'),
                dubai: hubRevenue(inWeek, 'AE'),
                china: hubRevenue(inWeek, 'CN'),
            };
        });
        const byCat = new Map();
        for (const o of orders) {
            if (orderIsCancelled(o.status))
                continue;
            const category = orderCategoryFromTitle(o.title, products);
            const kes = (0, currency_1.parseKesFromLabel)(o.price_kes);
            byCat.set(category, (byCat.get(category) ?? 0) + kes);
        }
        const sorted = [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
        const maxVal = sorted[0]?.[1] ?? 1;
        const top_categories = sorted.map(([name, value_kes]) => ({
            name,
            value_usd: Math.round(value_kes),
            pct: maxVal > 0 ? Math.round((value_kes / maxVal) * 100) : 0,
        }));
        return { weekly_volume, top_categories };
    }
}
exports.PostgresStore = PostgresStore;
function orderIsCancelled(status) {
    return status.toUpperCase().includes('CANCEL');
}
function orderCategoryFromTitle(title, products) {
    const base = title.replace(/\s*\(×\d+\)\s*$/i, '').trim();
    const match = products.find((p) => base === p.name || base.startsWith(p.name) || p.name.startsWith(base));
    return match?.category ?? 'Other';
}
function timeAgo(date) {
    if (!date)
        return '—';
    const ms = Date.now() - date.getTime();
    const hours = Math.floor(ms / 3600000);
    if (hours < 24)
        return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
}
