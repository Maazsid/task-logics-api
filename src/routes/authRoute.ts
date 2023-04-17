import express, { Router } from 'express';
import { loginController, registerController, verifyOTPController } from '../controllers/authController';

const router: Router = express.Router();

router.post('/login', loginController);

router.post('/register', registerController);

router.post('/verify-otp', verifyOTPController);

export default router;
