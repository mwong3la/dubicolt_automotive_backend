"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dubicoltStore = void 0;
exports.initDubicoltStore = initDubicoltStore;
const db_1 = require("../database/db");
const mvp_store_1 = require("./mvp.store");
let mvpStore = null;
async function initDubicoltStore() {
    (0, db_1.assertDatabaseConfigured)();
    await (0, db_1.initializeDatabase)();
    mvpStore = new mvp_store_1.MvpStore();
    await mvpStore.init();
    console.log('Persistence: PostgreSQL (Dubicolt Automotive MVP)');
}
function getStore() {
    if (!mvpStore) {
        throw new Error('Data store not initialized. Call initDubicoltStore() first.');
    }
    return mvpStore;
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
