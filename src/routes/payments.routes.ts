import { Router } from 'express';
import * as controller from '../controllers/payments.controller';

const router = Router();

router.post('/mpesa/stk-push', controller.stkPush);
router.post('/callback', controller.callback);

export default router;
