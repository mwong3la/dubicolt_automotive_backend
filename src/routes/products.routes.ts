import { Router } from 'express';
import * as productsController from '../controllers/products.controller';

const router = Router();

router.get('/:id/related', productsController.getRelated);
router.get('/:id', productsController.getProduct);

export default router;
