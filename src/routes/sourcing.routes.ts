import { Router } from 'express';
import * as sourcingController from '../controllers/sourcing.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/sourcing', sourcingController.getDashboard);
router.post('/sourcing/requests', sourcingController.createRequest);
router.get('/sourcing/requests/:id', sourcingController.getRequestDetail);
router.get('/orders/marketplace', sourcingController.listMarketplaceOrders);
router.get('/orders/marketplace/:id', sourcingController.getMarketplaceOrder);
router.get('/shipments', sourcingController.listShipments);
router.get('/shipments/:trackingId', sourcingController.getShipment);

export default router;
