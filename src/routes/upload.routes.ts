import { Router } from 'express';
import * as uploadController from '../controllers/upload.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

router.use(requireAuth);

router.post('/image', upload.single('file'), uploadController.uploadImage);
router.post('/images', upload.array('gallery', 8), uploadController.uploadImages);

export default router;
