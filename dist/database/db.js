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
const Product_1 = require("./models/Product");
const CartItem_1 = require("./models/CartItem");
const Vehicle_1 = require("./models/Vehicle");
const InventoryRecord_1 = require("./models/InventoryRecord");
const Order_1 = require("./models/Order");
const OrderItem_1 = require("./models/OrderItem");
const Payment_1 = require("./models/Payment");
const PartRequest_1 = require("./models/PartRequest");
const Quotation_1 = require("./models/Quotation");
const Supplier_1 = require("./models/Supplier");
const Delivery_1 = require("./models/Delivery");
const Category_1 = require("./models/Category");
const Promotion_1 = require("./models/Promotion");
const ReturnRequest_1 = require("./models/ReturnRequest");
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
        Product_1.Product,
        CartItem_1.CartItem,
        Vehicle_1.Vehicle,
        InventoryRecord_1.InventoryRecord,
        Order_1.Order,
        OrderItem_1.OrderItem,
        Payment_1.Payment,
        PartRequest_1.PartRequest,
        Quotation_1.Quotation,
        Supplier_1.Supplier,
        Delivery_1.Delivery,
        Category_1.Category,
        Promotion_1.Promotion,
        ReturnRequest_1.ReturnRequest,
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
                '  • DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in .env (e.g. dubicolt_automotive)\n' +
                '  • Server firewall / pg_hba allows your IP\n' +
                '  • DB_SSL_REJECT_UNAUTHORIZED=false for Azure dev if cert errors persist\n');
        }
        throw err;
    }
    await exports.db.sync({ alter: true });
    await (0, seed_runner_1.seedDatabaseIfEmpty)();
    console.log(`Postgres connected (${process.env.DB_HOST}/${process.env.DB_NAME})`);
}
