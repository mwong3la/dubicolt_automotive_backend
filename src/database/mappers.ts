import type { User } from './models/User';
import type { Product } from './models/Product';
import type { Category } from './models/Category';
import type { SourcingRequest } from './models/SourcingRequest';
import type { SourcingQuote } from './models/SourcingQuote';
import type { SourcingAttachment } from './models/SourcingAttachment';
import type { CartItem as CartItemModel } from './models/CartItem';
import type { Shipment } from './models/Shipment';
import type { MarketplaceOrder } from './models/MarketplaceOrder';
import { formatKsh } from '../utils/currency';
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

export function productToDto(p: Product): ProductDto {
  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: Number(p.price_usd),
    original_price: p.original_price != null ? Number(p.original_price) : null,
    origin: p.origin,
    image_url: p.image_url,
    images: p.images ?? [],
    specs: p.specs ?? {},
    currency_ke: p.currency_ke ?? formatKsh(Number(p.price_usd)),
    currency_ae: p.currency_ke ?? formatKsh(Number(p.price_usd)),
    description: p.description ?? '',
    vendor: p.vendor ?? p.brand ?? 'Verified supplier',
    category: p.category,
    review_count: 0,
    logistics_note:
      p.description?.trim() ||
      'Lead time and routing depend on origin hub and destination port. Customs clearance available on request.',
  };
}

export function productToMarketplace(p: Product): MarketplaceProduct {
  return {
    id: `mp-${p.id}`,
    product_id: p.id,
    name: p.name,
    vendor: p.vendor ?? 'Dubiken',
    origin: p.origin,
    price_usd: Number(p.price_usd),
    price_kes: formatKsh(Number(p.price_usd)),
    price_aed: formatKsh(Number(p.price_usd)),
    image_url: p.image_url,
    cta: p.marketplace_cta ?? 'cart',
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

export function productToInventory(p: Product): AdminInventoryItem {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category,
    origin: p.origin as HubCode,
    image_url: p.image_url,
    stock: p.stock,
    low_stock: p.low_stock,
    value: `$${(Number(p.price_usd) * p.stock).toLocaleString()}`,
    marketplace_price: `$${Number(p.price_usd).toFixed(2)} USD`,
    stock_levels: [{ hub: p.origin as HubCode, percent: 70, low: p.low_stock }],
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
    budget_total: sr.budget_total ?? '—',
    budget_subtitle: sr.budget_subtitle ?? 'Estimated Total',
    regional_targets: (sr.regional_targets ?? []) as SourcingRequestDetail['regional_targets'],
    attachments,
    quotes,
    destination_port: sr.destination_port ?? sr.destination,
    estimated_budget_range: sr.estimated_budget_range,
    requester_location: sr.requester_location ?? sr.destination,
    product_image_url: sr.product_image_url ?? sr.reference_images?.[0],
  };
}

export function quoteToDto(q: SourcingQuote) {
  return {
    id: q.id,
    unit_price: q.unit_price,
    shipping_cost: q.shipping_cost,
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
    price: sr.budget_total ?? 'Pending quote',
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
    budget_total: sr.budget_total ?? list.price,
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
    estimated_budget_range: sr.estimated_budget_range,
  };
}

export function cartItemToDto(row: CartItemModel): CartItem {
  const p = row.product!;
  return {
    id: row.id,
    product_id: row.product_id,
    name: p.name,
    sku: p.sku,
    quantity: row.quantity,
    unit_price: Number(p.price_usd),
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
