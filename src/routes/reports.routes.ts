import { Router } from 'express';
import * as controller from '../controllers/reports.controller';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/dashboard', controller.dashboard);
router.get('/analytics', controller.analytics);

export default router;
