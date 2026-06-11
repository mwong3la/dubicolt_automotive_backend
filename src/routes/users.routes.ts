import { Router } from 'express';
import * as controller from '../controllers/users.controller';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth, requireAdmin);
router.get('/', controller.list);
router.post('/', controller.create);
router.patch('/:id', controller.update);

export default router;
