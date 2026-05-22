"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.assertDatabaseConfigured = assertDatabaseConfigured;
exports.initializeDatabase = initializeDatabase;
const sequelize_typescript_1 = require("sequelize-typescript");
const config_1 = __importDefault(require("./config/config"));
const User_1 = require("./models/User");
const Category_1 = require("./models/Category");
const Product_1 = require("./models/Product");
const CartItem_1 = require("./models/CartItem");
const CheckoutSession_1 = require("./models/CheckoutSession");
const SourcingRequest_1 = require("./models/SourcingRequest");
const SourcingQuote_1 = require("./models/SourcingQuote");
const SourcingAttachment_1 = require("./models/SourcingAttachment");
const Shipment_1 = require("./models/Shipment");
const MarketplaceOrder_1 = require("./models/MarketplaceOrder");
const AdminSourcingOrder_1 = require("./models/AdminSourcingOrder");
const seed_runner_1 = require("./seed-runner");
const env = process.env.NODE_ENV || 'development';
const envConfig = config_1.default[env];
function assertDatabaseConfigured() {
    const missing = ['DB_NAME', 'DB_HOST', 'DB_USER', 'DB_PASSWORD'].filter((k) => !process.env[k]);
    if (missing.length) {
        throw new Error(`PostgreSQL is required. Set in .env: ${missing.join(', ')}`);
    }
}
const sequelizeOptions = {
    ...envConfig,
    dialect: 'postgres',
    models: [
        User_1.User,
        Category_1.Category,
        Product_1.Product,
        CartItem_1.CartItem,
        CheckoutSession_1.CheckoutSession,
        SourcingRequest_1.SourcingRequest,
        SourcingQuote_1.SourcingQuote,
        SourcingAttachment_1.SourcingAttachment,
        Shipment_1.Shipment,
        MarketplaceOrder_1.MarketplaceOrder,
        AdminSourcingOrder_1.AdminSourcingOrder,
    ],
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
};
exports.db = new sequelize_typescript_1.Sequelize(sequelizeOptions);
async function initializeDatabase() {
    assertDatabaseConfigured();
    try {
        await exports.db.authenticate();
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('no encryption') || msg.includes('pg_hba')) {
            console.error('\nPostgreSQL connection failed. For remote hosts, SSL is enabled automatically.\n' +
                'Also check:\n' +
                '  • DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in .env (use a Dubiken database, e.g. dubiken)\n' +
                '  • Server firewall / pg_hba allows your IP\n' +
                '  • DB_SSL_REJECT_UNAUTHORIZED=false for Azure dev if cert errors persist\n');
        }
        throw err;
    }
    await exports.db.sync({ alter: true });
    await (0, seed_runner_1.seedDatabaseIfEmpty)();
    console.log(`Postgres connected (${process.env.DB_HOST}/${process.env.DB_NAME})`);
}
