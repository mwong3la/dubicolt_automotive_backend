import type { User } from './models/User';
import type { Product } from './models/Product';
import type { Category } from './models/Category';
import type { SourcingRequest } from './models/SourcingRequest';
import type { SourcingQuote } from './models/SourcingQuote';
import type { SourcingAttachment } from './models/SourcingAttachment';
import type { CartItem as CartItemModel } from './models/CartItem';
import type { Shipment } from './models/Shipment';
import type { MarketplaceOrder } from './models/MarketplaceOrder';
import {
  formatKshLabelFromKes,
  kesToUsd,
  normalizeStoredMoneyLabel,
  productSavePercentKes,
  usdToKes,
} from '../utils/currency';
import type {
  AdminCategory,
  AdminInventoryItem,
  CartItem,
  DubikenUser,
  HubCode,
  MarketplaceProduct,
  Product as ProductDto,
  Shipment as ShipmentDto,
  SourcingRequest as SourcingRequestDto,
  SourcingRequestDetail,
  UserSourcingDetail,
  UserSourcingListItem,
} from '../dubiken/types';

export function userToDomain(u: User): DubikenUser {
  return {
    id: u.id,
    email: u.email,
    passwordHash: u.password,
    name: u.name,
    company: u.company,
    role: u.role,
  };
}

function resolvePriceKes(p: Product): number {
  if (p.price_kes != null && Number(p.price_kes) > 0) return Math.round(Number(p.price_kes));
  return usdToKes(Number(p.price_usd));
}

function resolveCompareAtKes(p: Product): number | null {
  if (p.compare_at_price_kes != null && Number(p.compare_at_price_kes) > 0) {
    return Math.round(Number(p.compare_at_price_kes));
  }
  if (p.original_price != null && Number(p.original_price) > 0) {
    return usdToKes(Number(p.original_price));
  }
  return null;
}

export function productToDto(p: Product): ProductDto {
  const price_kes = resolvePriceKes(p);
  const compare_at_price_kes = resolveCompareAtKes(p);
  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    price_kes,
    compare_at_price_kes,
    save_percent: productSavePercentKes(price_kes, compare_at_price_kes),
    price: kesToUsd(price_kes),
    original_price: compare_at_price_kes != null ? kesToUsd(compare_at_price_kes) : null,
    origin: p.origin,
    image_url: p.image_url,
    images: p.images ?? [],
    specs: p.specs ?? {},
    currency_ke: p.currency_ke ?? formatKshLabelFromKes(price_kes),
    currency_ae: p.currency_ke ?? formatKshLabelFromKes(price_kes),
    description: p.description ?? '',
    vendor: productDisplayVendor(p),
    category: p.category,
    review_count: 0,
    logistics_note:
      p.description?.trim() ||
      'Lead time and routing depend on origin hub and destination port. Customs clearance available on request.',
  };
}

function resolveMinOrder(p: Product): number {
  const col = Number(p.min_order);
  if (Number.isFinite(col) && col > 0) return Math.round(col);
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
export function productDisplayVendor(p: Product): string {
  const raw = (p.brand?.trim() || p.vendor?.trim() || '').trim();
  if (!raw || GENERIC_VENDOR_NAMES.has(raw.toLowerCase())) return '';
  return raw;
}

export function productToMarketplace(p: Product): MarketplaceProduct {
  const price_kes = resolvePriceKes(p);
  return {
    id: `mp-${p.id}`,
    product_id: p.id,
    name: p.name,
    vendor: productDisplayVendor(p),
    origin: p.origin,
    price_usd: kesToUsd(price_kes),
    price_kes: formatKshLabelFromKes(price_kes),
    price_aed: formatKshLabelFromKes(price_kes),
    image_url: p.image_url,
    cta: p.marketplace_cta ?? 'cart',
    stock: Math.max(0, Number(p.stock) || 0),
    min_order: resolveMinOrder(p),
  };
}

export function categoryToAdmin(c: Category): AdminCategory {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    origins: c.origins as HubCode[],
    trend: c.trend,
    trend_variant: c.trend_variant,
    total_skus: c.total_skus,
    vendors: c.vendors,
    image_url: c.image_url,
    status: c.status,
  };
}

const HUB_LABELS: Record<HubCode, string> = {
  KE: 'Kenya',
  AE: 'Dubai (UAE)',
  CN: 'China',
};

function resolveProductStatus(p: Product): 'draft' | 'published' {
  if (p.status === 'published' || p.status === 'draft') return p.status;
  return p.on_marketplace ? 'published' : 'draft';
}

export function productToInventory(p: Product): AdminInventoryItem {
  const origin = p.origin as HubCode;
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
    value: formatKshLabelFromKes(priceKes * p.stock),
    marketplace_price: formatKshLabelFromKes(priceKes),
    stock_levels: [{ hub: origin, percent: 100, low: p.low_stock }],
  };
}

export function sourcingToAdminList(sr: SourcingRequest): SourcingRequestDto {
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
    market: sr.market as HubCode,
    reference_images: sr.reference_images ?? [],
    reference_extra: sr.reference_extra,
    has_document: sr.has_document,
    created_at: sr.createdAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

export async function sourcingToAdminDetail(
  sr: SourcingRequest,
): Promise<SourcingRequestDetail> {
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
    budget_total: normalizeStoredMoneyLabel(sr.budget_total) || '—',
    budget_subtitle: sr.budget_subtitle ?? 'Estimated Total',
    regional_targets: (sr.regional_targets ?? []) as SourcingRequestDetail['regional_targets'],
    attachments,
    quotes,
    destination_port: sr.destination_port ?? sr.destination,
    estimated_budget_range: sr.estimated_budget_range
      ? normalizeStoredMoneyLabel(sr.estimated_budget_range)
      : undefined,
    requester_location: sr.requester_location ?? sr.destination,
    product_image_url: sr.product_image_url ?? sr.reference_images?.[0],
  };
}

export function quoteToDto(q: SourcingQuote) {
  return {
    id: q.id,
    unit_price: normalizeStoredMoneyLabel(q.unit_price),
    shipping_cost: q.shipping_cost ? normalizeStoredMoneyLabel(q.shipping_cost) : undefined,
    lead_time: q.lead_time,
    shipment: q.shipment,
    notes: q.notes,
    official: q.official,
  };
}

export function sourcingToUserList(sr: SourcingRequest): UserSourcingListItem {
  return {
    id: sr.id,
    request_number: sr.request_number,
    title: sr.product_title,
    origin: sr.origin,
    price: sr.budget_total ? normalizeStoredMoneyLabel(sr.budget_total) : 'Pending quote',
    status: sr.user_status ?? 'PENDING',
    status_variant: sr.status_variant ?? 'gray',
  };
}

export async function sourcingToUserDetail(sr: SourcingRequest): Promise<UserSourcingDetail> {
  const list = sourcingToUserList(sr);
  const quotes = (sr.quotes ?? []).map(quoteToDto);
  return {
    ...list,
    description: sr.description,
    quantity: sr.quantity ?? '—',
    voltage_range: sr.voltage_range,
    budget_total:
      sr.budget_total && sr.budget_total !== 'Pending quote'
        ? normalizeStoredMoneyLabel(sr.budget_total)
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
      ? normalizeStoredMoneyLabel(sr.estimated_budget_range)
      : undefined,
    delivery_county: sr.destination,
    delivery_address: sr.requester_location,
  };
}

export function cartItemToDto(row: CartItemModel): CartItem {
  const p = row.product!;
  const unit_price_kes = resolvePriceKes(p);
  return {
    id: row.id,
    product_id: row.product_id,
    name: p.name,
    sku: p.sku,
    quantity: row.quantity,
    unit_price: kesToUsd(unit_price_kes),
    unit_price_kes,
    origin: p.origin,
    image_url: p.image_url,
  };
}

export function shipmentToDto(s: Shipment): ShipmentDto {
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

export function marketplaceOrderToDto(o: MarketplaceOrder) {
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
