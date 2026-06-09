import { Router } from 'express';
import authRoutes from './auth.routes';
import vehiclesRoutes from './vehicles.routes';
import productsRoutes from './products.routes';
import inventoryRoutes from './inventory.routes';
import cartRoutes from './cart.routes';
import ordersRoutes from './orders.routes';
import paymentsRoutes from './payments.routes';
import partRequestsRoutes from './part-requests.routes';
import quotationsRoutes from './quotations.routes';
import suppliersRoutes from './suppliers.routes';
import deliveriesRoutes from './deliveries.routes';
import reportsRoutes from './reports.routes';
import uploadRoutes from './upload.routes';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/vehicles', vehiclesRoutes);
apiRouter.use('/products', productsRoutes);
apiRouter.use('/inventory', inventoryRoutes);
apiRouter.use('/cart', cartRoutes);
apiRouter.use('/orders', ordersRoutes);
apiRouter.use('/payments', paymentsRoutes);
apiRouter.use('/part-requests', partRequestsRoutes);
apiRouter.use('/quotations', quotationsRoutes);
apiRouter.use('/suppliers', suppliersRoutes);
apiRouter.use('/deliveries', deliveriesRoutes);
apiRouter.use('/reports', reportsRoutes);
apiRouter.use('/uploads', uploadRoutes);

export default apiRouter;
