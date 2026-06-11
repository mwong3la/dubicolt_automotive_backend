"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsService = exports.ReportsService = void 0;
const store_1 = require("../dubicolt/store");
class ReportsService {
    dashboard() {
        return store_1.dubicoltStore.getDashboard();
    }
    analytics() {
        return store_1.dubicoltStore.getAnalytics();
    }
}
exports.ReportsService = ReportsService;
exports.reportsService = new ReportsService();
