import { Router } from 'express';
import * as contactMessageController from '../controllers/contactMessage.controller';

const router = Router();

router.post('/', contactMessageController.createContactMessage);

export default router;
