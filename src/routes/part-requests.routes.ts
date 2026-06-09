import { Router } from 'express';
import * as controller from '../controllers/part-requests.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();
router.use(requireAuth);

router.post('/', controller.create);
router.get('/', controller.list);
router.get('/:id', controller.get);

export default router;
