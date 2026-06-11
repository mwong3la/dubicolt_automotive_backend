import { Router } from 'express';
import * as controller from '../controllers/categories.controller';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', controller.list);
router.get('/:id', controller.get);

router.use(requireAuth, requireAdmin);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
