"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userToDomain = userToDomain;
exports.productToDto = productToDto;
exports.productDisplayVendor = productDisplayVendor;
exports.productToMarketplace = productToMarketplace;
exports.categoryToAdmin = categoryToAdmin;
exports.productToInventory = productToInventory;
exports.sourcingToAdminList = sourcingToAdminList;
exports.sourcingToAdminDetail = sourcingToAdminDetail;
exports.quoteToDto = quoteToDto;
exports.sourcingToUserList = sourcingToUserList;
exports.sourcingToUserDetail = sourcingToUserDetail;
exports.cartItemToDto = cartItemToDto;
exports.shipmentToDto = shipmentToDto;
exports.marketplaceOrderToDto = marketplaceOrderToDto;
const currency_1 = require("../utils/currency");
function userToDomain(u) {
    return {
        id: u.id,
        email: u.email,
        passwordHash: u.password,
        name: u.name,
        company: u.company,
        role: u.role,
    };
}
function resolvePriceKes(p) {
    if (p.price_kes != null && Number(p.price_kes) > 0)
        return Math.round(Number(p.price_kes));
    return (0, currency_1.usdToKes)(Number(p.price_usd));
}
function resolveCompareAtKes(p) {
    if (p.compare_at_price_kes != null && Number(p.compare_at_price_kes) > 0) {
        return Math.round(Number(p.compare_at_price_kes));
    }
    if (p.original_price != null && Number(p.original_price) > 0) {
        return (0, currency_1.usdToKes)(Number(p.original_price));
    }
    return null;
}
function productToDto(p) {
    const price_kes = resolvePriceKes(p);
    const compare_at_price_kes = resolveCompareAtKes(p);
    return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        price_kes,
        compare_at_price_kes,
        save_percent: (0, currency_1.productSavePercentKes)(price_kes, compare_at_price_kes),
        price: (0, currency_1.kesToUsd)(price_kes),
        original_price: compare_at_price_kes != null ? (0, currency_1.kesToUsd)(compare_at_price_kes) : null,
        origin: p.origin,
        image_url: p.image_url,
        images: p.images ?? [],
        specs: p.specs ?? {},
        currency_ke: p.currency_ke ?? (0, currency_1.formatKshLabelFromKes)(price_kes),
        currency_ae: p.currency_ke ?? (0, currency_1.formatKshLabelFromKes)(price_kes),
        description: p.description ?? '',
        vendor: productDisplayVendor(p),
        category: p.category,
        review_count: 0,
        logistics_note: p.description?.trim() ||
            'Lead time and routing depend on origin hub and destination port. Customs clearance available on request.',
    };
}
function resolveMinOrder(p) {
    const col = Number(p.min_order);
    if (Number.isFinite(col) && col > 0)
        return Math.round(col);
    const raw = p.specs?.moq ?? p.specs?.MOQ ?? p.specs?.min_order;
    const n = parseInt(String(raw ?? ''), 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
}
const GENERIC_VENDOR_NAMES = new Set([
    'dubiken',
    'dubiken marketplace',
    'verified supplier',
    'verified oem',
]);
/** Brand or supplier name for cards — never the platform name */
function productDisplayVendor(p) {
    const raw = (p.brand?.trim() || p.vendor?.trim() || '').trim();
    if (!raw || GENERIC_VENDOR_NAMES.has(raw.toLowerCase()))
        return '';
    return raw;
}
function productToMarketplace(p) {
    const price_kes = resolvePriceKes(p);
    return {
        id: `mp-${p.id}`,
        product_id: p.id,
        name: p.name,
        vendor: productDisplayVendor(p),
        origin: p.origin,
        price_usd: (0, currency_1.kesToUsd)(price_kes),
        price_kes: (0, currency_1.formatKshLabelFromKes)(price_kes),
        price_aed: (0, currency_1.formatKshLabelFromKes)(price_kes),
        image_url: p.image_url,
        cta: p.marketplace_cta ?? 'cart',
        stock: Math.max(0, Number(p.stock) || 0),
        min_order: resolveMinOrder(p),
    };
}
function categoryToAdmin(c) {
    return {
        id: c.id,
        name: c.name,
        description: c.description,
        origins: c.origins,
        trend: c.trend,
        trend_variant: c.trend_variant,
        total_skus: c.total_skus,
        vendors: c.vendors,
        image_url: c.image_url,
        status: c.status,
    };
}
const HUB_LABELS = {
    KE: 'Kenya',
    AE: 'Dubai (UAE)',
    CN: 'China',
};
function resolveProductStatus(p) {
    if (p.status === 'published' || p.status === 'draft')
        return p.status;
    return p.on_marketplace ? 'published' : 'draft';
}
function productToInventory(p) {
    const origin = p.origin;
    const priceKes = resolvePriceKes(p);
    return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        origin,
        origin_label: HUB_LABELS[origin] ?? p.origin,
        image_url: p.image_url,
        stock: p.stock,
        low_stock: p.low_stock,
        status: resolveProductStatus(p),
        value: (0, currency_1.formatKshLabelFromKes)(priceKes * p.stock),
        marketplace_price: (0, currency_1.formatKshLabelFromKes)(priceKes),
        stock_levels: [{ hub: origin, percent: 100, low: p.low_stock }],
    };
}
function sourcingToAdminList(sr) {
    return {
        id: sr.id,
        request_number: sr.request_number,
        client_name: sr.client_name ?? '—',
        client_initials: sr.client_initials ?? '—',
        product_title: sr.product_title,
        description: sr.description,
        destination: sr.destination,
        destination_label: sr.destination_label ?? sr.destination,
        status: sr.status,
        market: sr.market,
        reference_images: sr.reference_images ?? [],
        reference_extra: sr.reference_extra,
        has_document: sr.has_document,
        created_at: sr.createdAt?.toISOString?.() ?? new Date().toISOString(),
    };
}
async function sourcingToAdminDetail(sr) {
    const quotes = (sr.quotes ?? []).map(quoteToDto);
    const attachments = (sr.attachments ?? []).map((a) => ({
        name: a.name,
        size: a.size,
        type: a.type,
        url: a.url,
    }));
    return {
        ...sourcingToAdminList(sr),
        quantity: sr.quantity ?? '—',
        material_grade: sr.material_grade,
        voltage_range: sr.voltage_range,
        budget_total: (0, currency_1.normalizeStoredMoneyLabel)(sr.budget_total) || '—',
        budget_subtitle: sr.budget_subtitle ?? 'Estimated Total',
        regional_targets: (sr.regional_targets ?? []),
        attachments,
        quotes,
        destination_port: sr.destination_port ?? sr.destination,
        estimated_budget_range: sr.estimated_budget_range
            ? (0, currency_1.normalizeStoredMoneyLabel)(sr.estimated_budget_range)
            : undefined,
        requester_location: sr.requester_location ?? sr.destination,
        product_image_url: sr.product_image_url ?? sr.reference_images?.[0],
    };
}
function quoteToDto(q) {
    return {
        id: q.id,
        unit_price: (0, currency_1.normalizeStoredMoneyLabel)(q.unit_price),
        shipping_cost: q.shipping_cost ? (0, currency_1.normalizeStoredMoneyLabel)(q.shipping_cost) : undefined,
        lead_time: q.lead_time,
        shipment: q.shipment,
        notes: q.notes,
        official: q.official,
    };
}
function sourcingToUserList(sr) {
    return {
        id: sr.id,
        request_number: sr.request_number,
        title: sr.product_title,
        origin: sr.origin,
        price: sr.budget_total ? (0, currency_1.normalizeStoredMoneyLabel)(sr.budget_total) : 'Pending quote',
        status: sr.user_status ?? 'PENDING',
        status_variant: sr.status_variant ?? 'gray',
    };
}
async function sourcingToUserDetail(sr) {
    const list = sourcingToUserList(sr);
    const quotes = (sr.quotes ?? []).map(quoteToDto);
    return {
        ...list,
        description: sr.description,
        quantity: sr.quantity ?? '—',
        voltage_range: sr.voltage_range,
        budget_total: sr.budget_total && sr.budget_total !== 'Pending quote'
            ? (0, currency_1.normalizeStoredMoneyLabel)(sr.budget_total)
            : list.price,
        budget_subtitle: sr.budget_subtitle ?? 'Estimated Total',
        regional_targets: sr.regional_targets ?? [],
        attachments: (sr.attachments ?? []).map((a) => ({
            name: a.name,
            size: a.size,
            type: a.type,
            url: a.url,
        })),
        quotes,
        destination_port: sr.destination_port,
        estimated_budget_range: sr.estimated_budget_range
            ? (0, currency_1.normalizeStoredMoneyLabel)(sr.estimated_budget_range)
            : undefined,
        delivery_county: sr.destination,
        delivery_address: sr.requester_location,
    };
}
function cartItemToDto(row) {
    const p = row.product;
    const unit_price_kes = resolvePriceKes(p);
    return {
        id: row.id,
        product_id: row.product_id,
        name: p.name,
        sku: p.sku,
        quantity: row.quantity,
        unit_price: (0, currency_1.kesToUsd)(unit_price_kes),
        unit_price_kes,
        origin: p.origin,
        image_url: p.image_url,
    };
}
function shipmentToDto(s) {
    return {
        id: s.id,
        tracking_id: s.tracking_id,
        current_status: s.current_status,
        origin_city: s.origin_city,
        destination_city: s.destination_city,
        vessel: s.vessel ?? '',
        milestones: s.milestones,
    };
}
function marketplaceOrderToDto(o) {
    return {
        id: o.id,
        order_number: o.order_number,
        tracking_id: o.tracking_id ?? null,
        title: o.title,
        vendor: o.vendor,
        origin_flag: o.origin_flag,
        image_url: o.image_url,
        status: o.status,
        status_icon: o.status_icon,
        progress_step: o.progress_step,
        price_kes: o.price_kes,
        price_secondary: '',
        date_label: o.date_label,
        date_value: o.date_value,
        primary_action: o.primary_action,
        secondary_action: o.secondary_action,
        primary_style: o.primary_style,
    };
}
