import { Router } from 'express';
import * as cartController from '../controllers/cart.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/guest', cartController.guestCheckout);

router.use(requireAuth);

router.post('/shipping', cartController.checkoutShipping);
router.post('/complete', cartController.checkoutComplete);

export default router;
