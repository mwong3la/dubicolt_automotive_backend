import { Router } from 'express';
import * as controller from '../controllers/quotations.controller';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.post('/', requireAdmin, controller.create);
router.get('/:id', controller.get);
router.post('/:id/accept', controller.accept);
router.post('/:id/reject', controller.reject);

export default router;
