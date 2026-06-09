import { Sequelize, SequelizeOptions } from 'sequelize-typescript';
import config from './config/config';
import { User } from './models/User';
import { Product } from './models/Product';
import { CartItem } from './models/CartItem';
import { Vehicle } from './models/Vehicle';
import { InventoryRecord } from './models/InventoryRecord';
import { Order } from './models/Order';
import { OrderItem } from './models/OrderItem';
import { Payment } from './models/Payment';
import { PartRequest } from './models/PartRequest';
import { Quotation } from './models/Quotation';
import { Supplier } from './models/Supplier';
import { Delivery } from './models/Delivery';
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
    Product,
    CartItem,
    Vehicle,
    InventoryRecord,
    Order,
    OrderItem,
    Payment,
    PartRequest,
    Quotation,
    Supplier,
    Delivery,
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
          '  • DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in .env (e.g. dubicolt_automotive)\n' +
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
