"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dubikenStore = void 0;
exports.initDubikenStore = initDubikenStore;
const db_1 = require("../database/db");
const postgres_store_1 = require("./postgres.store");
let postgresStore = null;
async function initDubikenStore() {
    (0, db_1.assertDatabaseConfigured)();
    await (0, db_1.initializeDatabase)();
    postgresStore = new postgres_store_1.PostgresStore();
    await postgresStore.init();
    console.log('Persistence: PostgreSQL (all data from database)');
    if (process.env.AZURE_STORAGE_CONNECTION_STRING && process.env.AZURE_STORAGE_CONTAINER_NAME) {
        console.log('Azure Blob: configured');
    }
    else {
        console.warn('Azure Blob: not configured — uploads need AZURE_STORAGE_* env vars');
    }
}
function getStore() {
    if (!postgresStore) {
        throw new Error('Data store not initialized. Call initDubikenStore() first.');
    }
    return postgresStore;
}
/** All reads/writes go through PostgreSQL — no in-memory fallback. */
exports.dubikenStore = new Proxy({}, {
    get(_target, prop) {
        const store = getStore();
        const value = store[prop];
        if (typeof value === 'function') {
            return value.bind(store);
        }
        return value;
    },
});
