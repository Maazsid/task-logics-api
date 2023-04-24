import express, { Router } from 'express';
import {
  forgotPasswordController,
  loginController,
  logoutController,
  refreshTokenController,
  registerController,
  resendOTPController,
  resetPasswordController,
  verifyOTPController
} from '../controllers/authController';
import { isAuthenticated } from '../middlewares/authMiddleware';

const router: Router = express.Router();

router.post('/login', loginController);

router.post('/register', registerController);

router.post('/verify-otp', verifyOTPController);

router.post('/resend-otp', resendOTPController);

router.post('/forgot-password', forgotPasswordController);

router.post('/reset-password', resetPasswordController);

router.post('/refresh-token', refreshTokenController);

router.post('/logout', isAuthenticated, logoutController);

export default router;
