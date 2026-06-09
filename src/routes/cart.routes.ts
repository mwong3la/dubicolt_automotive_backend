import { Router } from 'express';
import * as controller from '../controllers/cart.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/', controller.getCart);
router.post('/items', controller.addItem);
router.put('/items/:id', controller.updateItem);
router.delete('/items/:id', controller.removeItem);
router.post('/checkout', controller.checkout);

export default router;
