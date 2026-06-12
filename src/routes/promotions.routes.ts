import { Router } from 'express';
import * as controller from '../controllers/promotions.controller';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.post('/validate', requireAuth, controller.validate);
router.get('/', requireAuth, requireAdmin, controller.list);
router.post('/', requireAuth, requireAdmin, controller.create);
router.put('/:id', requireAuth, requireAdmin, controller.update);

export default router;
