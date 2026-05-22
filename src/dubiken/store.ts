import { assertDatabaseConfigured, initializeDatabase } from '../database/db';
import { PostgresStore } from './postgres.store';

let postgresStore: PostgresStore | null = null;

export async function initDubikenStore(): Promise<void> {
  assertDatabaseConfigured();
  await initializeDatabase();
  postgresStore = new PostgresStore();
  await postgresStore.init();
  console.log('Persistence: PostgreSQL (all data from database)');
  if (process.env.AZURE_STORAGE_CONNECTION_STRING && process.env.AZURE_STORAGE_CONTAINER_NAME) {
    console.log('Azure Blob: configured');
  } else {
    console.warn('Azure Blob: not configured — uploads need AZURE_STORAGE_* env vars');
  }
}

function getStore(): PostgresStore {
  if (!postgresStore) {
    throw new Error('Data store not initialized. Call initDubikenStore() first.');
  }
  return postgresStore;
}

/** All reads/writes go through PostgreSQL — no in-memory fallback. */
export const dubikenStore: PostgresStore = new Proxy({} as PostgresStore, {
  get(_target, prop: keyof PostgresStore) {
    const store = getStore();
    const value = store[prop];
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(store);
    }
    return value;
  },
});

export type DubikenDataStore = PostgresStore;
