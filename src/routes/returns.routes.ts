import { Router } from 'express';
import * as controller from '../controllers/returns.controller';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', requireAuth, controller.list);
router.post('/', requireAuth, controller.create);
router.put('/:id', requireAuth, requireAdmin, controller.update);

export default router;
