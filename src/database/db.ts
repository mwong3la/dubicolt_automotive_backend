import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import bcrypt from 'bcrypt';
import config from './config/config';
import { User } from './models/User';
import { Vehicle } from './models/Vehicle';
import { Inspection } from './models/Inspection';
import { DiagnosticReport } from './models/DiagnosticReport';
import { SubscriptionPlan } from './models/SubscriptionPlan';
import { Subscription } from './models/Subscription';
import { Payment } from './models/Payment';
import { ContactMessage } from './models/ContactMessage';

const env = process.env.NODE_ENV || 'development';
const envConfig = config[env as keyof typeof config];

const db = new Sequelize({
  ...envConfig,
  models: [
    User,
    Vehicle,
    Inspection,
    DiagnosticReport,
    SubscriptionPlan,
    Subscription,
    Payment,
    ContactMessage,
  ],
  logging: false,
});

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
    const [record] = await SubscriptionPlan.findOrCreate({
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
  const legacyPlans = await SubscriptionPlan.findAll({
    where: { slug: { [Op.in]: ['starter', 'pro'] } },
  });
  const standardPlan = await SubscriptionPlan.findOne({ where: { slug: 'standard' } });
  if (standardPlan && legacyPlans.length > 0) {
    const legacyIds = legacyPlans.map((p) => p.id);
    await Subscription.update(
      { planId: standardPlan.id },
      { where: { planId: { [Op.in]: legacyIds } } }
    );
  }
  await SubscriptionPlan.destroy({ where: { slug: { [Op.in]: ['starter', 'pro'] } } });

  console.log('Seeded subscription plans (Standard, Plus, Premium)');
}

async function seedDefaultUsers() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@coltium-auto.com';
  const techEmail = process.env.SEED_TECH_EMAIL || 'tech@coltium-auto.com';
  const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || 'Coltium123!';

  const existingAdmin = await User.findOne({ where: { email: adminEmail } });
  const existingTech = await User.findOne({ where: { email: techEmail } });

  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  if (!existingAdmin) {
    await User.create({
      email: adminEmail,
      password: passwordHash,
      name: 'Coltium Admin',
      role: 'admin',
      isActive: true,
    } as any);
    console.log(`Seeded admin user: ${adminEmail} / ${defaultPassword}`);
  }

  if (!existingTech) {
    await User.create({
      email: techEmail,
      password: passwordHash,
      name: 'Coltium Technician',
      role: 'technician',
      isActive: true,
    } as any);
    console.log(`Seeded technician user: ${techEmail} / ${defaultPassword}`);
  }
}

async function initializeDatabase() {
  try {
    await db.sync({ alter: true });
    await seedSubscriptionPlans();
    await seedDefaultUsers();
    console.log('Database synced successfully (Coltium-Auto)');
  } catch (error) {
    console.error('Failed to sync database:', error);
  }
}

export { db, initializeDatabase };
