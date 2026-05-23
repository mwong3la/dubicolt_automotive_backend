import { Router } from 'express';
import * as shipmentsController from '../controllers/shipments.controller';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/:trackingId', shipmentsController.getByTrackingId);
router.get('/', requireAuth, requireAdmin, shipmentsController.list);

export default router;
