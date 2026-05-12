import { Router } from 'express';
import authRouter from './auth.routes';
import userRouter from './users.routes';
import vehicleRouter from './vehicle.routes';
import inspectionRouter from './inspection.routes';
import reportRouter from './report.routes';
import subscriptionRouter from './subscription.routes';
import paymentRouter from './payment.routes';
import adminRouter from './admin.routes';
import contactMessageRouter from './contactMessage.routes';
import isAuthenticated from '../middlewares/auth.middleware';

const apiRouter = Router();

apiRouter.use('/contact-messages', contactMessageRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', isAuthenticated, userRouter);
apiRouter.use('/vehicles', vehicleRouter);
apiRouter.use('/inspections', inspectionRouter);
apiRouter.use('/reports', reportRouter);
apiRouter.use('/subscriptions', subscriptionRouter);
apiRouter.use('/payments', paymentRouter);
apiRouter.use('/admin', adminRouter);

export default apiRouter;
