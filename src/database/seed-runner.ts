import bcrypt from 'bcrypt';
import { User } from './models/User';
import { Product } from './models/Product';
import { Category } from './models/Category';
import * as dubicoltSeed from '../dubicolt/seed';
import { InventoryRecord } from './models/InventoryRecord';
import { Supplier } from './models/Supplier';

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function seedDatabaseIfEmpty(): Promise<void> {
  const count = await User.count();
  if (count > 0) return;

  const passwordHash = await bcrypt.hash(dubicoltSeed.DEFAULT_PASSWORD, 10);

  for (const u of dubicoltSeed.SEED_USERS) {
    await User.create({
      id: u.id,
      email: u.email,
      name: u.name,
      company: u.company,
      role: u.role,
      password: passwordHash,
      is_active: true,
    });
  }

  await seedDubicoltCatalog();
  console.log('Seeded Dubicolt Automotive database (users, products, suppliers, inventory)');
}

async function seedCategoriesFromProducts(): Promise<void> {
  const seen = new Set<string>();
  for (const p of dubicoltSeed.SEED_PRODUCTS) {
    if (seen.has(p.category)) continue;
    seen.add(p.category);
    const slug = slugify(p.category);
    const exists = await Category.findOne({ where: { name: p.category } });
    if (!exists) {
      await Category.create({
        name: p.category,
        slug,
        description: '',
        image_url: p.imageUrl,
        status: 'published',
        origins: ['KE'],
      });
    }
  }
}

export async function seedDubicoltCatalog(): Promise<void> {
  await seedCategoriesFromProducts();

  for (const s of dubicoltSeed.SEED_SUPPLIERS) {
    const exists = await Supplier.findOne({ where: { name: s.name } });
    if (!exists) await Supplier.create(s);
  }

  for (const p of dubicoltSeed.SEED_PRODUCTS) {
    const existing = await Product.findOne({ where: { sku: p.sku } });
    if (existing) {
      await existing.update({
        name: p.title,
        description: p.description,
        category: p.category,
        brand: p.brand,
        oem_number: p.oemNumber,
        compatible_vehicles: p.compatibleVehicles,
        price_kes: p.sellingPrice,
        price_usd: p.sellingPrice / 130,
        image_url: p.images?.[0] ?? p.imageUrl,
        images: p.images?.length ? p.images : [p.imageUrl],
        stock: p.stock,
        status: 'published',
        on_marketplace: true,
      });
      const inv = await InventoryRecord.findOne({ where: { product_id: existing.id } });
      if (inv) await inv.update({ quantity: p.stock });
      else await InventoryRecord.create({ product_id: existing.id, quantity: p.stock });
    } else {
      const row = await Product.create({
        sku: p.sku,
        name: p.title,
        description: p.description,
        category: p.category,
        brand: p.brand,
        oem_number: p.oemNumber,
        compatible_vehicles: p.compatibleVehicles,
        price_kes: p.sellingPrice,
        price_usd: p.sellingPrice / 130,
        image_url: p.images?.[0] ?? p.imageUrl,
        images: p.images?.length ? p.images : [p.imageUrl],
        origin: 'KE',
        specs: {},
        stock: p.stock,
        low_stock: p.stock < 10,
        status: 'published',
        on_marketplace: true,
        marketplace_cta: 'cart',
        vendor: p.brand,
      });
      await InventoryRecord.create({ product_id: row.id, quantity: p.stock });
    }
  }
}
