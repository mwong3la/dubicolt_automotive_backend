import { Router } from 'express';
import authRoutes from './auth.routes';
import productsRoutes from './products.routes';
import storefrontRoutes from './storefront.routes';
import cartRoutes from './cart.routes';
import checkoutRoutes from './checkout.routes';
import sourcingRoutes from './sourcing.routes';
import adminRoutes from './admin.routes';
import shipmentsRoutes from './shipments.routes';
import uploadRoutes from './upload.routes';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/products', productsRoutes);
apiRouter.use(storefrontRoutes);
apiRouter.use('/cart', cartRoutes);
apiRouter.use('/checkout', checkoutRoutes);
apiRouter.use('/me', sourcingRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/shipments', shipmentsRoutes);
apiRouter.use('/uploads', uploadRoutes);

export default apiRouter;
