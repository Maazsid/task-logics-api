import express, { Router } from 'express';
import {
  forgotPasswordController,
  loginController,
  refreshTokenController,
  registerController,
  resendOTPController,
  resetPasswordController,
  verifyOTPController
} from '../controllers/authController';

const router: Router = express.Router();

router.post('/login', loginController);

router.post('/register', registerController);

router.post('/verify-otp', verifyOTPController);

router.post('/resend-otp', resendOTPController);

router.post('/forgot-password', forgotPasswordController);

router.post('/reset-password', resetPasswordController);

router.post('/refresh-token', refreshTokenController);

export default router;
