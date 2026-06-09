import { Router } from 'express';
import * as controller from '../controllers/suppliers.controller';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();
router.use(requireAuth, requireAdmin);

router.post('/', controller.create);
router.get('/', controller.list);
router.put('/:id', controller.update);

export default router;
