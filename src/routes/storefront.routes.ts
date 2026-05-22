import { Router } from 'express';
import * as productsController from '../controllers/products.controller';

const router = Router();

router.get('/home', productsController.getHomeFeed);
router.get('/marketplace/products', productsController.listMarketplace);
router.get('/categories', productsController.listCategories);

export default router;
