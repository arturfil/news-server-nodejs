import express from 'express';
import { AdminController } from '../controllers/admin.controller';

const router = express.Router();
const adminController = new AdminController();

router.post('/states', adminController.createState);
router.post('/topics', adminController.createTopic);

export default router;
