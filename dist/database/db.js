"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.initializeDatabase = initializeDatabase;
const sequelize_1 = require("sequelize");
const sequelize_typescript_1 = require("sequelize-typescript");
const bcrypt_1 = __importDefault(require("bcrypt"));
const config_1 = __importDefault(require("./config/config"));
const User_1 = require("./models/User");
const Vehicle_1 = require("./models/Vehicle");
const Inspection_1 = require("./models/Inspection");
const DiagnosticReport_1 = require("./models/DiagnosticReport");
const SubscriptionPlan_1 = require("./models/SubscriptionPlan");
const Subscription_1 = require("./models/Subscription");
const Payment_1 = require("./models/Payment");
const ContactMessage_1 = require("./models/ContactMessage");
const env = process.env.NODE_ENV || 'development';
const envConfig = config_1.default[env];
const db = new sequelize_typescript_1.Sequelize({
    ...envConfig,
    models: [
        User_1.User,
        Vehicle_1.Vehicle,
        Inspection_1.Inspection,
        DiagnosticReport_1.DiagnosticReport,
        SubscriptionPlan_1.SubscriptionPlan,
        Subscription_1.Subscription,
        Payment_1.Payment,
        ContactMessage_1.ContactMessage,
    ],
    logging: false,
});
exports.db = db;
// Plans as per document: name, description, pricing, and listed features only (no inferred limits).
const DOCUMENT_PLANS = [
    {
        slug: 'standard',
        name: 'Personal Vehicle Health Plan – Standard',
        description: 'For private vehicle owners who want preventive monitoring.',
        priceMonthly: 1400,
        priceYearly: 14000,
        features: [
            'One preventive diagnostic every 6 months',
            '10% discount on additional on-demand visits',
            'Priority booking',
            'Digital service history access',
        ],
    },
    {
        slug: 'plus',
        name: 'Personal Vehicle Health Plan – Plus',
        description: 'Enhanced preventive monitoring with second-opinion support.',
        priceMonthly: 2000,
        priceYearly: 20000,
        features: [
            'One preventive diagnostic every 4 months',
            '15% discount on additional visits',
            'Second-opinion support included',
            'Priority scheduling',
            'Digital service history',
        ],
    },
    {
        slug: 'premium',
        name: 'Personal Vehicle Health Plan – Premium',
        description: 'Highest tier with insurance and warranty diagnostic eligibility.',
        priceMonthly: 2800,
        priceYearly: 28000,
        features: [
            'One preventive diagnostic every 3 months',
            '20% discount on additional visits',
            'Insurance and warranty diagnostic eligibility',
            'Highest priority scheduling',
            'Dedicated advisory support',
            'Digital service history',
        ],
    },
];
async function seedSubscriptionPlans() {
    for (const plan of DOCUMENT_PLANS) {
        const [record] = await SubscriptionPlan_1.SubscriptionPlan.findOrCreate({
            where: { slug: plan.slug },
            defaults: {
                name: plan.name,
                description: plan.description,
                priceMonthly: plan.priceMonthly,
                priceYearly: plan.priceYearly,
                features: plan.features,
                inspectionLimit: null,
            },
        });
        if (record) {
            await record.update({
                name: plan.name,
                description: plan.description,
                priceMonthly: plan.priceMonthly,
                priceYearly: plan.priceYearly,
                features: plan.features,
                inspectionLimit: null,
            });
        }
    }
    // Migrate any subscriptions from legacy plans (Starter, Pro) to Standard, then remove legacy plans
    const legacyPlans = await SubscriptionPlan_1.SubscriptionPlan.findAll({
        where: { slug: { [sequelize_1.Op.in]: ['starter', 'pro'] } },
    });
    const standardPlan = await SubscriptionPlan_1.SubscriptionPlan.findOne({ where: { slug: 'standard' } });
    if (standardPlan && legacyPlans.length > 0) {
        const legacyIds = legacyPlans.map((p) => p.id);
        await Subscription_1.Subscription.update({ planId: standardPlan.id }, { where: { planId: { [sequelize_1.Op.in]: legacyIds } } });
    }
    await SubscriptionPlan_1.SubscriptionPlan.destroy({ where: { slug: { [sequelize_1.Op.in]: ['starter', 'pro'] } } });
    console.log('Seeded subscription plans (Standard, Plus, Premium)');
}
async function seedDefaultUsers() {
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@coltium-auto.com';
    const techEmail = process.env.SEED_TECH_EMAIL || 'tech@coltium-auto.com';
    const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || 'Coltium123!';
    const existingAdmin = await User_1.User.findOne({ where: { email: adminEmail } });
    const existingTech = await User_1.User.findOne({ where: { email: techEmail } });
    const passwordHash = await bcrypt_1.default.hash(defaultPassword, 10);
    if (!existingAdmin) {
        await User_1.User.create({
            email: adminEmail,
            password: passwordHash,
            name: 'Coltium Admin',
            role: 'admin',
            isActive: true,
        });
        console.log(`Seeded admin user: ${adminEmail} / ${defaultPassword}`);
    }
    if (!existingTech) {
        await User_1.User.create({
            email: techEmail,
            password: passwordHash,
            name: 'Coltium Technician',
            role: 'technician',
            isActive: true,
        });
        console.log(`Seeded technician user: ${techEmail} / ${defaultPassword}`);
    }
}
async function initializeDatabase() {
    try {
        await db.sync({ alter: true });
        await seedSubscriptionPlans();
        await seedDefaultUsers();
        console.log('Database synced successfully (Coltium-Auto)');
    }
    catch (error) {
        console.error('Failed to sync database:', error);
    }
}
