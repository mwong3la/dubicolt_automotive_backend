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
exports.seedDubicoltCatalog = seedDubicoltCatalog;
const bcrypt_1 = __importDefault(require("bcrypt"));
const User_1 = require("./models/User");
const Product_1 = require("./models/Product");
const Category_1 = require("./models/Category");
const dubicoltSeed = __importStar(require("../dubicolt/seed"));
const InventoryRecord_1 = require("./models/InventoryRecord");
const Supplier_1 = require("./models/Supplier");
function slugify(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
async function seedDatabaseIfEmpty() {
    const count = await User_1.User.count();
    if (count > 0)
        return;
    const passwordHash = await bcrypt_1.default.hash(dubicoltSeed.DEFAULT_PASSWORD, 10);
    for (const u of dubicoltSeed.SEED_USERS) {
        await User_1.User.create({
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
async function seedCategoriesFromProducts() {
    const seen = new Set();
    for (const p of dubicoltSeed.SEED_PRODUCTS) {
        if (seen.has(p.category))
            continue;
        seen.add(p.category);
        const slug = slugify(p.category);
        const exists = await Category_1.Category.findOne({ where: { name: p.category } });
        if (!exists) {
            await Category_1.Category.create({
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
async function seedDubicoltCatalog() {
    await seedCategoriesFromProducts();
    for (const s of dubicoltSeed.SEED_SUPPLIERS) {
        const exists = await Supplier_1.Supplier.findOne({ where: { name: s.name } });
        if (!exists)
            await Supplier_1.Supplier.create(s);
    }
    for (const p of dubicoltSeed.SEED_PRODUCTS) {
        const existing = await Product_1.Product.findOne({ where: { sku: p.sku } });
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
            const inv = await InventoryRecord_1.InventoryRecord.findOne({ where: { product_id: existing.id } });
            if (inv)
                await inv.update({ quantity: p.stock });
            else
                await InventoryRecord_1.InventoryRecord.create({ product_id: existing.id, quantity: p.stock });
        }
        else {
            const row = await Product_1.Product.create({
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
            await InventoryRecord_1.InventoryRecord.create({ product_id: row.id, quantity: p.stock });
        }
    }
}
