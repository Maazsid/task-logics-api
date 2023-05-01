import { Task } from '@prisma/client';
import { AddTaskReq } from '../interfaces/task/add-task-req.model';
import prisma from '../utils/db/client';

export const addTask = async (body: AddTaskReq, userId: number): Promise<Task> => {
  const task = await prisma.task.create({
    data: {
      userId: userId,
      description: body.description,
      startTime: body?.startTime
    }
  });

  return task;
};
