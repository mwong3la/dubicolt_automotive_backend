"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const technicianController = __importStar(require("../controllers/technician.controller"));
const adminSubscriptionController = __importStar(require("../controllers/adminSubscription.controller"));
const adminPaymentController = __importStar(require("../controllers/adminPayment.controller"));
const adminPlanController = __importStar(require("../controllers/adminPlan.controller"));
const contactMessageController = __importStar(require("../controllers/contactMessage.controller"));
const auth_middleware_1 = __importDefault(require("../middlewares/auth.middleware"));
const auth_middleware_2 = require("../middlewares/auth.middleware");
const rbac_types_1 = require("../types/rbac.types");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.default);
router.use((0, auth_middleware_2.requireRole)([rbac_types_1.UserRole.ADMIN]));
router.get('/technicians', technicianController.list);
router.post('/technicians', technicianController.create);
// Plans: list, create, update
router.get('/plans', adminPlanController.listPlans);
router.post('/plans', adminPlanController.createPlan);
router.patch('/plans/:id', adminPlanController.updatePlan);
// Subscriptions: list and update status
router.get('/subscriptions', adminSubscriptionController.listSubscriptions);
router.patch('/subscriptions/:id/status', adminSubscriptionController.updateSubscriptionStatus);
// Payments: list all, create manual
router.get('/payments', adminPaymentController.listPayments);
router.post('/payments', adminPaymentController.createManualPayment);
// Website contact form submissions
router.get('/contact-messages', contactMessageController.listContactMessages);
exports.default = router;
