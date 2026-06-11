import { Router } from 'express';
import * as controller from '../controllers/payments.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/callback', controller.callback);

router.use(requireAuth);
router.get('/', controller.list);
router.get('/order/:orderId', controller.byOrder);
router.post('/mpesa/stk-push', controller.stkPush);

export default router;
