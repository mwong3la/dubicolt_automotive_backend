import bcrypt from 'bcrypt';
import { User } from './models/User';
import { Product } from './models/Product';
import * as dubicoltSeed from '../dubicolt/seed';
import { InventoryRecord } from './models/InventoryRecord';
import { Supplier } from './models/Supplier';

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

  await seedDubicoltMvpCatalog();
  console.log('Seeded Dubicolt Automotive database (users, products, suppliers, inventory)');
}

export async function seedDubicoltMvpCatalog(): Promise<void> {
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
        image_url: p.imageUrl,
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
        image_url: p.imageUrl,
        images: [p.imageUrl],
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
