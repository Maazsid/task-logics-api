import express, { Router } from 'express';
import { addTaskController } from '../controllers/taskController';
import { isAuthorized } from '../middlewares/authMiddleware';
import { UserPermissions } from '../constants/permissionsEnum';

const router: Router = express.Router();

router.post('/', isAuthorized([UserPermissions.UserCanCreate]), addTaskController);

export default router;
