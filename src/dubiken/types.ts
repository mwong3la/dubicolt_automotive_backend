export type HubCode = 'KE' | 'AE' | 'CN';
export type UserRole = 'buyer' | 'admin' | 'vendor';
export type AdminSourcingStatus = 'pending' | 'quoted' | 'shipping' | 'delivered';
export type CategoryStatus = 'draft' | 'published';
export type StatusVariant = 'orange' | 'blue' | 'gray' | 'red';
export type MarketplaceCta = 'cart' | 'quote';
export type AttachmentType = 'pdf' | 'zip';

export interface DubikenUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  company: string;
  role: UserRole;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  original_price: number | null;
  origin: string;
  image_url: string;
  images: string[];
  specs: Record<string, string>;
  currency_ke: string;
  currency_ae: string;
  description: string;
  vendor: string;
  category: string;
  review_count: number;
  logistics_note: string;
}

export interface SourcingRequest {
  id: string;
  request_number: string;
  client_name: string;
  client_initials: string;
  product_title: string;
  description: string;
  destination: string;
  destination_label: string;
  status: AdminSourcingStatus;
  market: HubCode;
  reference_images: string[];
  reference_extra?: number;
  has_document?: boolean;
  created_at: string;
}

export interface SourcingQuote {
  id: string;
  unit_price: string;
  shipping_cost?: string;
  lead_time: string;
  shipment: string;
  notes: string;
  official: boolean;
}

export interface SourcingRequestDetail extends SourcingRequest {
  quantity: string;
  material_grade?: string;
  voltage_range?: string;
  budget_total: string;
  budget_subtitle: string;
  regional_targets: { code: HubCode; label: string }[];
  attachments: { name: string; size: string; type: AttachmentType; url?: string }[];
  quotes: SourcingQuote[];
  quote_date?: string;
  destination_port?: string;
  estimated_budget_range?: string;
  requester_location?: string;
  product_image_url?: string;
}

export interface UserSourcingListItem {
  id: string;
  request_number: string;
  title: string;
  origin: string;
  price: string;
  status: string;
  status_variant: StatusVariant;
}

export interface UserSourcingDetail extends UserSourcingListItem {
  description: string;
  quantity: string;
  voltage_range?: string;
  budget_total: string;
  budget_subtitle: string;
  regional_targets: { code: string; label: string }[];
  attachments: { name: string; size: string; type: AttachmentType; url?: string }[];
  quotes: SourcingQuote[];
  quote_date?: string;
  destination_port?: string;
  estimated_budget_range?: string;
}

export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  origin: string;
  image_url: string;
}

export interface AdminCategory {
  id: string;
  name: string;
  description: string;
  origins: HubCode[];
  trend: string;
  trend_variant: 'up' | 'stable' | 'down';
  total_skus: number;
  vendors: number;
  image_url: string;
  status: CategoryStatus;
}

export interface AdminInventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  origin: HubCode;
  image_url: string;
  stock: number;
  low_stock: boolean;
  value: string;
  marketplace_price: string;
  stock_levels: { hub: HubCode; percent: number; low?: boolean }[];
}

export interface MarketplaceProduct {
  id: string;
  product_id: string;
  name: string;
  vendor: string;
  origin: string;
  price_usd: number;
  price_kes: string;
  price_aed: string;
  image_url: string;
  cta: MarketplaceCta;
}

export interface Shipment {
  id: string;
  tracking_id: string;
  current_status: string;
  origin_city: string;
  destination_city: string;
  vessel: string;
  milestones: {
    label: string;
    detail: string;
    date: string;
    done: boolean;
    active?: boolean;
  }[];
}
