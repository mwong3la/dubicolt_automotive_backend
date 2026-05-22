import { Sequelize, SequelizeOptions } from 'sequelize-typescript';
import config from './config/config';
import { User } from './models/User';
import { Category } from './models/Category';
import { Product } from './models/Product';
import { CartItem } from './models/CartItem';
import { CheckoutSession } from './models/CheckoutSession';
import { SourcingRequest } from './models/SourcingRequest';
import { SourcingQuote } from './models/SourcingQuote';
import { SourcingAttachment } from './models/SourcingAttachment';
import { Shipment } from './models/Shipment';
import { MarketplaceOrder } from './models/MarketplaceOrder';
import { AdminSourcingOrder } from './models/AdminSourcingOrder';
import { seedDatabaseIfEmpty } from './seed-runner';

const env = process.env.NODE_ENV || 'development';
const envConfig = config[env as keyof typeof config];

export function assertDatabaseConfigured(): void {
  const missing = ['DB_NAME', 'DB_HOST', 'DB_USER', 'DB_PASSWORD'].filter(
    (k) => !process.env[k],
  );
  if (missing.length) {
    throw new Error(
      `PostgreSQL is required. Set in .env: ${missing.join(', ')}`,
    );
  }
}

const sequelizeOptions: SequelizeOptions = {
  ...(envConfig as SequelizeOptions),
  dialect: 'postgres',
  models: [
    User,
    Category,
    Product,
    CartItem,
    CheckoutSession,
    SourcingRequest,
    SourcingQuote,
    SourcingAttachment,
    Shipment,
    MarketplaceOrder,
    AdminSourcingOrder,
  ],
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
};

export const db = new Sequelize(sequelizeOptions);

export async function initializeDatabase(): Promise<void> {
  assertDatabaseConfigured();
  try {
    await db.authenticate();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('no encryption') || msg.includes('pg_hba')) {
      console.error(
        '\nPostgreSQL connection failed. For remote hosts, SSL is enabled automatically.\n' +
          'Also check:\n' +
          '  • DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in .env (use a Dubiken database, e.g. dubiken)\n' +
          '  • Server firewall / pg_hba allows your IP\n' +
          '  • DB_SSL_REJECT_UNAUTHORIZED=false for Azure dev if cert errors persist\n',
      );
    }
    throw err;
  }
  await db.sync({ alter: true });
  await seedDatabaseIfEmpty();
  console.log(
    `Postgres connected (${process.env.DB_HOST}/${process.env.DB_NAME})`,
  );
}
