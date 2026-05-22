import { Router } from 'express';
import * as cartController from '../controllers/cart.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', cartController.getCart);
router.post('/items', cartController.addItem);
router.patch('/items/:lineId', cartController.updateItem);
router.delete('/items/:lineId', cartController.removeItem);

export default router;
