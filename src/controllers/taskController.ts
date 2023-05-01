import { JoiErrorConfig } from '../constants/joi.const';
import { ResponseStatusEnum } from '../constants/responseStatusEnum';
import { AddTaskReq } from '../interfaces/task/add-task-req.model';
import { UpdateTaskReq } from '../interfaces/task/update-task-req.model';
import { asyncHandler } from '../middlewares/asyncHandler';
import { addTask, updateTask } from '../services/taskService';
import { createResponseBody } from '../utils/utils';
import { addTaskValidator, updateTaskValidator } from '../validators/task.validator';

export const addTaskController = asyncHandler(async (req, res) => {
  const body: AddTaskReq = req.body;

  try {
    await addTaskValidator.validateAsync(body, JoiErrorConfig);
  } catch (err: any) {
    res
      .status(400)
      .json(createResponseBody(ResponseStatusEnum.Fail, null, err?.message || 'Something went wrong.'));

    return;
  }

  const { userId } = req?.decodedToken || {};

  const addedTask = await addTask(body, userId);

  res
    .status(200)
    .json(createResponseBody(ResponseStatusEnum.Success, addedTask, ['Task created successfully!']));

  return;
});

export const updateTaskController = asyncHandler(async (req, res) => {
  const body: UpdateTaskReq = req.body;

  try {
    await updateTaskValidator.validateAsync(body, JoiErrorConfig);
  } catch (err: any) {
    res
      .status(400)
      .json(createResponseBody(ResponseStatusEnum.Fail, null, err?.message || 'Something went wrong.'));

    return;
  }

  const taskId = parseInt(req.params.taskId);

  const updatedTask = await updateTask(body, taskId);

  res
    .status(200)
    .json(createResponseBody(ResponseStatusEnum.Success, updatedTask, ['Task updated successfully!']));

  return;
});
