import { Task } from '@prisma/client';
import { AddTaskReq } from '../interfaces/task/add-task-req.model';
import prisma from '../utils/db/client';
import { UpdateTaskReq } from '../interfaces/task/update-task-req.model';

export const addTask = async (body: AddTaskReq, userId: number): Promise<Task> => {
  const task = await prisma.task.create({
    data: {
      userId: userId,
      description: body.description,
      startTime: body.startTime
    }
  });

  return task;
};

export const updateTask = async (body: UpdateTaskReq, taskId: number): Promise<Task> => {
  const updatedTask = await prisma.task.update({
    where: {
      id: taskId
    },
    data: {
      description: body?.description,
      startTime: body?.startTime,
      endTime: body?.endTime
    }
  });

  return updatedTask;
};
