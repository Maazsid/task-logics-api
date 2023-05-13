import express, { Router } from 'express';
import {
  addTaskController,
  deleteTaskController,
  getTasksController,
  updateTaskController
} from '../controllers/taskController';
import { isAuthorized } from '../middlewares/authMiddleware';
import { UserPermissions } from '../constants/permissionsEnum';
import { queryParamsHandler } from '../middlewares/queryParamsHandler';

const router: Router = express.Router();

router.get('/', isAuthorized([UserPermissions.UserCanRead]), queryParamsHandler, getTasksController);

router.post('/', isAuthorized([UserPermissions.UserCanCreate]), addTaskController);

router.put('/:taskId', isAuthorized([UserPermissions.UserCanUpdate]), updateTaskController);

router.delete('/:taskId', isAuthorized([UserPermissions.UserCanDelete]), deleteTaskController);

export default router;
