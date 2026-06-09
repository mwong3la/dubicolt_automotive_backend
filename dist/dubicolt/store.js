"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dubicoltStore = void 0;
exports.initDubicoltStore = initDubicoltStore;
const db_1 = require("../database/db");
const data_store_1 = require("./data.store");
let dataStore = null;
async function initDubicoltStore() {
    (0, db_1.assertDatabaseConfigured)();
    await (0, db_1.initializeDatabase)();
    dataStore = new data_store_1.DataStore();
    await dataStore.init();
    console.log('Persistence: PostgreSQL (Dubicolt Automotive)');
}
function getStore() {
    if (!dataStore) {
        throw new Error('Data store not initialized. Call initDubicoltStore() first.');
    }
    return dataStore;
}
exports.dubicoltStore = new Proxy({}, {
    get(_target, prop) {
        const store = getStore();
        const value = store[prop];
        if (typeof value === 'function') {
            return value.bind(store);
        }
        return value;
    },
});
