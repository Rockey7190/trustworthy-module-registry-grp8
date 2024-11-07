import { Router } from 'express';
import { getMetrics } from './metricsController';
import { uploadRouter } from './Routes/uploadRoutes';

export const router = Router();

router.get('/metrics', getMetrics);
router.use('/packages', uploadRouter); // Adds /packages/upload and /packages/update routes

