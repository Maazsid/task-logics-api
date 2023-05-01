import express, { Router } from 'express';
import authRoute from './authRoute';
import taskRoute from './taskRoute';
import { isAuthenticated } from '../middlewares/authMiddleware';

const router: Router = express.Router();

router.use('/api/auth', authRoute);

router.use('/api/task', isAuthenticated, taskRoute);

export default router;
