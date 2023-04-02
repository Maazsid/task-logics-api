import express, { Router } from 'express';
import { registerController } from '../controllers/authController';

const router: Router = express.Router();

router.post('/register', registerController);

export default router;
