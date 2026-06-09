import { assertDatabaseConfigured, initializeDatabase } from '../database/db';
import { MvpStore } from './mvp.store';

let mvpStore: MvpStore | null = null;

export async function initDubicoltStore(): Promise<void> {
  assertDatabaseConfigured();
  await initializeDatabase();
  mvpStore = new MvpStore();
  await mvpStore.init();
  console.log('Persistence: PostgreSQL (Dubicolt Automotive MVP)');
}

function getStore(): MvpStore {
  if (!mvpStore) {
    throw new Error('Data store not initialized. Call initDubicoltStore() first.');
  }
  return mvpStore;
}

export const dubicoltStore: MvpStore = new Proxy({} as MvpStore, {
  get(_target, prop: keyof MvpStore) {
    const store = getStore();
    const value = store[prop];
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(store);
    }
    return value;
  },
});
