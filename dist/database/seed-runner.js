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
exports.seedDatabaseIfEmpty = seedDatabaseIfEmpty;
const bcrypt_1 = __importDefault(require("bcrypt"));
const User_1 = require("./models/User");
const Category_1 = require("./models/Category");
const Product_1 = require("./models/Product");
const SourcingRequest_1 = require("./models/SourcingRequest");
const SourcingQuote_1 = require("./models/SourcingQuote");
const Shipment_1 = require("./models/Shipment");
const MarketplaceOrder_1 = require("./models/MarketplaceOrder");
const AdminSourcingOrder_1 = require("./models/AdminSourcingOrder");
const seed = __importStar(require("../dubiken/seed"));
const seed_ids_1 = require("./seed-ids");
async function seedDatabaseIfEmpty() {
    const count = await User_1.User.count();
    if (count > 0)
        return;
    const passwordHash = await bcrypt_1.default.hash(seed.DEFAULT_PASSWORD, 10);
    for (const u of seed.SEED_USERS) {
        await User_1.User.create({
            id: seed_ids_1.sid.user(u.id),
            email: u.email,
            name: u.name,
            company: u.company,
            role: u.role,
            password: passwordHash,
            is_active: true,
        });
    }
    for (const c of seed.adminCategories) {
        await Category_1.Category.create({
            id: seed_ids_1.sid.category(c.id),
            name: c.name,
            description: c.description,
            origins: c.origins,
            image_url: c.image_url,
            status: c.status,
            trend: c.trend,
            trend_variant: c.trend_variant,
            total_skus: c.total_skus,
            vendors: c.vendors,
        });
    }
    const productIdBySku = new Map();
    for (const p of seed.products) {
        const row = await Product_1.Product.create({
            id: seed_ids_1.sid.product(p.id),
            sku: p.sku,
            name: p.name,
            description: p.description,
            category: 'Renewable Energy',
            origin: p.origin,
            price_usd: p.price,
            price_kes: p.price_kes,
            original_price: p.original_price,
            compare_at_price_kes: p.compare_at_price_kes,
            image_url: p.image_url,
            images: p.images,
            specs: p.specs,
            currency_ke: p.currency_ke,
            currency_ae: p.currency_ae,
            stock: 100,
            low_stock: false,
            status: 'published',
            on_marketplace: true,
            marketplace_cta: 'cart',
            vendor: 'Dubiken',
        });
        productIdBySku.set(p.sku, row.id);
    }
    for (const mp of seed.marketplaceProducts) {
        const product = await Product_1.Product.findByPk(seed_ids_1.sid.product(mp.product_id));
        if (product) {
            await product.update({
                status: 'published',
                on_marketplace: true,
                vendor: mp.vendor,
                marketplace_cta: mp.cta,
            });
        }
    }
    for (const inv of seed.adminInventoryItems) {
        const existing = await Product_1.Product.findOne({ where: { sku: inv.sku } });
        if (!existing) {
            await Product_1.Product.create({
                sku: inv.sku,
                name: inv.name,
                description: inv.name,
                category: inv.category,
                origin: inv.origin,
                price_usd: parseFloat(inv.marketplace_price.replace(/[^0-9.]/g, '')) || 0,
                image_url: inv.image_url,
                images: [inv.image_url],
                specs: {},
                stock: inv.stock,
                low_stock: inv.low_stock,
                status: 'published',
                on_marketplace: true,
                marketplace_cta: 'cart',
                vendor: 'Dubiken',
            });
        }
    }
    for (const sr of seed.adminSourcingRequests) {
        const extra = seed.adminSourcingDetails[sr.id];
        const linkedListId = seed.adminUserSourcingMap[sr.id];
        await SourcingRequest_1.SourcingRequest.create({
            id: seed_ids_1.sid.sourcing(sr.id),
            user_id: linkedListId ? seed_ids_1.sid.user('usr_buyer') : null,
            request_number: sr.request_number,
            product_title: sr.product_title,
            description: sr.description,
            origin: sr.market,
            destination: sr.destination,
            destination_label: sr.destination_label,
            status: sr.status,
            market: sr.market,
            client_name: sr.client_name,
            client_initials: sr.client_initials,
            reference_images: sr.reference_images,
            reference_extra: sr.reference_extra,
            has_document: sr.has_document ?? false,
            quantity: extra?.quantity,
            voltage_range: extra?.voltage_range,
            budget_total: extra?.budget_total,
            budget_subtitle: extra?.budget_subtitle,
            regional_targets: extra?.regional_targets ?? [],
            requester_location: extra?.requester_location,
            product_image_url: extra?.product_image_url,
            user_status: seed.userSourcingDetails[linkedListId ?? '']?.status,
            status_variant: seed.userSourcingDetails[linkedListId ?? '']?.status_variant,
        });
        if (extra?.quotes?.length) {
            for (const q of extra.quotes) {
                await SourcingQuote_1.SourcingQuote.create({
                    sourcing_request_id: seed_ids_1.sid.sourcing(sr.id),
                    unit_price: q.unit_price,
                    shipping_cost: q.shipping_cost,
                    lead_time: q.lead_time,
                    shipment: q.shipment,
                    notes: q.notes,
                    official: q.official ?? true,
                });
            }
        }
    }
    for (const item of seed.userSourcingList) {
        const requestId = seed_ids_1.sid.sourcing(item.id);
        const exists = await SourcingRequest_1.SourcingRequest.findOne({ where: { id: requestId } });
        if (!exists) {
            const detail = seed.userSourcingDetails[item.id];
            await SourcingRequest_1.SourcingRequest.create({
                id: requestId,
                user_id: seed_ids_1.sid.user('usr_buyer'),
                request_number: item.request_number,
                product_title: item.title,
                description: detail?.description ?? item.title,
                origin: item.origin,
                destination: detail?.destination_port ?? '—',
                status: 'pending',
                market: item.origin,
                user_status: item.status,
                status_variant: item.status_variant,
                budget_total: item.price,
                regional_targets: detail?.regional_targets ?? [],
            });
        }
    }
    for (const s of seed.shipments) {
        await Shipment_1.Shipment.create({
            id: seed_ids_1.sid.shipment(s.id),
            tracking_id: s.tracking_id,
            current_status: s.current_status,
            origin_city: s.origin_city,
            destination_city: s.destination_city,
            vessel: s.vessel,
            milestones: s.milestones,
        });
    }
    for (const o of seed.userMarketplaceOrders) {
        await MarketplaceOrder_1.MarketplaceOrder.create({
            id: seed_ids_1.sid.marketplaceOrder(o.id),
            user_id: seed_ids_1.sid.user('usr_buyer'),
            order_number: o.order_number,
            tracking_id: o.tracking_id,
            title: o.title,
            vendor: o.vendor,
            origin_flag: o.origin_flag,
            image_url: o.image_url,
            status: o.status,
            status_icon: o.status_icon,
            progress_step: o.progress_step,
            price_kes: o.price_kes,
            price_secondary: o.price_secondary,
            date_label: o.date_label,
            date_value: o.date_value,
            primary_action: o.primary_action,
            secondary_action: o.secondary_action,
            primary_style: o.primary_style,
        });
    }
    for (const o of seed.adminSourcingOrders) {
        await AdminSourcingOrder_1.AdminSourcingOrder.create({
            id: seed_ids_1.sid.adminOrder(o.id),
            order_number: o.order_number,
            customer_name: o.customer_name,
            customer_detail: o.customer_detail,
            route: o.route,
            estimated_value: o.estimated_value,
            status: o.status,
            status_variant: o.status_variant,
            primary_action: o.primary_action,
            secondary_action: o.secondary_action,
        });
    }
    console.log('Seeded Dubiken database (users, products, sourcing, shipments, orders)');
}
