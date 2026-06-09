import { assertDatabaseConfigured, initializeDatabase } from '../database/db';
import { DataStore } from './data.store';

let dataStore: DataStore | null = null;

export async function initDubicoltStore(): Promise<void> {
  assertDatabaseConfigured();
  await initializeDatabase();
  dataStore = new DataStore();
  await dataStore.init();
  console.log('Persistence: PostgreSQL (Dubicolt Automotive)');
}

function getStore(): DataStore {
  if (!dataStore) {
    throw new Error('Data store not initialized. Call initDubicoltStore() first.');
  }
  return dataStore;
}

export const dubicoltStore: DataStore = new Proxy({} as DataStore, {
  get(_target, prop: keyof DataStore) {
    const store = getStore();
    const value = store[prop];
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(store);
    }
    return value;
  },
});
