import express from 'express';
import newsRoutes from './news.rotues';
import adminRoute from './admin.routes';

const router = express.Router();
router.use('/news', newsRoutes)
router.use("/admin", adminRoute)

export default router;
