import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/dashboard', adminController.getDashboard);
router.get('/analytics', adminController.getAnalytics);
router.get('/categories', adminController.listCategories);
router.get('/categories/:id', adminController.getCategory);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.get('/inventory/kpis', adminController.getInventoryKpis);
router.post('/inventory/sync-storefront', adminController.syncStorefront);
router.get('/inventory', adminController.listInventory);
router.post('/inventory/products', adminController.createInventoryProduct);
router.get('/inventory/products/:id', adminController.getInventoryProduct);
router.put('/inventory/products/:id', adminController.updateInventoryProduct);
router.get('/sourcing/requests', adminController.listSourcingRequests);
router.get('/sourcing/requests/:id', adminController.getSourcingDetail);
router.put('/sourcing/requests/:id/quote', adminController.saveOfficialQuote);
router.get('/orders', adminController.listOrders);

export default router;
