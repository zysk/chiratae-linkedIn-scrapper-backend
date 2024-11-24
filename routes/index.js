import { Router } from 'express';
import authRoutes from './auth';
import linkedinRoutes from './linkedin';
import campaignRoutes from './campaign';
import leadRoutes from './lead';
import emailRoutes from './email';

const router = Router();

router.use('/auth', authRoutes);
router.use('/linkedin', linkedinRoutes);
router.use('/campaign', campaignRoutes);
router.use('/lead', leadRoutes);
router.use('/email', emailRoutes);

export default router;