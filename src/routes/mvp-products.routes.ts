import { Router } from 'express';
import * as controller from '../controllers/mvp-products.controller';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/search', controller.search);
router.get('/', controller.list);
router.get('/:id', controller.get);

router.use(requireAuth, requireAdmin);
router.post('/', controller.create);
router.put('/:id', controller.update);

export default router;
