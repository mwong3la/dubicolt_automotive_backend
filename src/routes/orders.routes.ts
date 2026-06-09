import { Router } from 'express';
import * as controller from '../controllers/orders.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/', controller.list);
router.get('/:id', controller.get);

export default router;
