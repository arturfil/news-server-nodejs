import express, { Router } from 'express';
import { HealthController } from '../controllers/health.controller';

const router:Router = express.Router();
const healthController = new HealthController();

router.get('/', healthController.checkHealth);
router.get('/db', healthController.checkDatabase);
router.get('/redis', healthController.checkRedis);

export default router;
