import express, { Router } from 'express';
import {
  forgotPasswordController,
  googleOAuthController,
  loginController,
  logoutController,
  refreshTokenController,
  registerController,
  resendOTPController,
  resetPasswordController,
  verifyOTPController
} from '../controllers/authController';
import { isAuthenticated } from '../middlewares/authMiddleware';
import passport from 'passport';

const router: Router = express.Router();

router.post('/login', loginController);

router.post('/register', registerController);

router.post('/verify-otp', verifyOTPController);

router.post('/resend-otp', resendOTPController);

router.post('/forgot-password', forgotPasswordController);

router.post('/reset-password', resetPasswordController);

router.post('/refresh-token', refreshTokenController);

router.post('/logout', isAuthenticated, logoutController);

router.get('/google', passport.authenticate('googleStragety'));

router.get('/redirect/google', googleOAuthController);

export default router;
