import bcrypt from 'bcrypt';
import { User } from './models/User';
import { Category } from './models/Category';
import { Product } from './models/Product';
import { SourcingRequest } from './models/SourcingRequest';
import { SourcingQuote } from './models/SourcingQuote';
import { Shipment } from './models/Shipment';
import { MarketplaceOrder } from './models/MarketplaceOrder';
import { AdminSourcingOrder } from './models/AdminSourcingOrder';
import * as seed from '../dubiken/seed';
import { sid } from './seed-ids';

export async function seedDatabaseIfEmpty(): Promise<void> {
  const count = await User.count();
  if (count > 0) return;

  const passwordHash = await bcrypt.hash(seed.DEFAULT_PASSWORD, 10);

  for (const u of seed.SEED_USERS) {
    await User.create({
      id: sid.user(u.id),
      email: u.email,
      name: u.name,
      company: u.company,
      role: u.role,
      password: passwordHash,
      is_active: true,
    });
  }

  for (const c of seed.adminCategories) {
    await Category.create({
      id: sid.category(c.id),
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

  const productIdBySku = new Map<string, string>();

  for (const p of seed.products) {
    const row = await Product.create({
      id: sid.product(p.id),
      sku: p.sku,
      name: p.name,
      description: p.description,
      category: 'Renewable Energy',
      origin: p.origin,
      price_usd: p.price,
      original_price: p.original_price,
      image_url: p.image_url,
      images: p.images,
      specs: p.specs,
      currency_ke: p.currency_ke,
      currency_ae: p.currency_ae,
      stock: 100,
      low_stock: false,
      on_marketplace: true,
      marketplace_cta: 'cart',
      vendor: 'Dubiken',
    });
    productIdBySku.set(p.sku, row.id);
  }

  for (const mp of seed.marketplaceProducts) {
    const product = await Product.findByPk(sid.product(mp.product_id));
    if (product) {
      await product.update({
        on_marketplace: true,
        vendor: mp.vendor,
        marketplace_cta: mp.cta,
      });
    }
  }

  for (const inv of seed.adminInventoryItems) {
    const existing = await Product.findOne({ where: { sku: inv.sku } });
    if (!existing) {
      await Product.create({
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
        on_marketplace: true,
        marketplace_cta: 'cart',
        vendor: 'Dubiken',
      });
    }
  }

  for (const sr of seed.adminSourcingRequests) {
    const extra = seed.adminSourcingDetails[sr.id];
    const linkedListId = seed.adminUserSourcingMap[sr.id];
    await SourcingRequest.create({
      id: sid.sourcing(sr.id),
      user_id: linkedListId ? sid.user('usr_buyer') : null,
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
        await SourcingQuote.create({
          sourcing_request_id: sid.sourcing(sr.id),
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
    const requestId = sid.sourcing(item.id);
    const exists = await SourcingRequest.findOne({ where: { id: requestId } });
    if (!exists) {
      const detail = seed.userSourcingDetails[item.id];
      await SourcingRequest.create({
        id: requestId,
        user_id: sid.user('usr_buyer'),
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
    await Shipment.create({
      id: sid.shipment(s.id),
      tracking_id: s.tracking_id,
      current_status: s.current_status,
      origin_city: s.origin_city,
      destination_city: s.destination_city,
      vessel: s.vessel,
      milestones: s.milestones,
    });
  }

  for (const o of seed.userMarketplaceOrders) {
    await MarketplaceOrder.create({
      id: sid.marketplaceOrder(o.id),
      user_id: sid.user('usr_buyer'),
      order_number: o.order_number,
      tracking_id: (o as { tracking_id?: string }).tracking_id,
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
    await AdminSourcingOrder.create({
      id: sid.adminOrder(o.id),
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
