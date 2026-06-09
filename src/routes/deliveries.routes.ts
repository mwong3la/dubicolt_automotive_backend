import { Router } from 'express';
import * as controller from '../controllers/deliveries.controller';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/:id', requireAuth, controller.get);
router.post('/', requireAuth, requireAdmin, controller.create);
router.post('/:id/status', requireAuth, requireAdmin, controller.updateStatus);

export default router;
