import { Router } from 'express';
import * as shipmentsController from '../controllers/shipments.controller';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', requireAuth, requireAdmin, shipmentsController.list);
router.get('/:trackingId', shipmentsController.getByTrackingId);

export default router;
