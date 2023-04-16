import express, { Router } from 'express';
import { registerController, verifyOTPController } from '../controllers/authController';

const router: Router = express.Router();

router.post('/register', registerController);

router.post('/verify-otp', verifyOTPController);

export default router;
