import { Router } from 'express';
import * as controller from '../controllers/inventory.controller';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();
router.use(requireAuth, requireAdmin);

router.post('/stock-in', controller.stockIn);
router.post('/stock-out', controller.stockOut);
router.get('/', controller.list);

export default router;
