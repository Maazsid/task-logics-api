import { Task } from '@prisma/client';
import { AddTaskReq } from '../interfaces/task/add-task-req.model';
import prisma from '../utils/db/client';
import { UpdateTaskReq } from '../interfaces/task/update-task-req.model';
import { GetTasks } from '../interfaces/partial-types/tasks.model';

export const getTasks = async (userId: number): Promise<GetTasks[]> => {
  const tasks = await prisma.task.findMany({
    where: {
      userId: userId,
      isDeleted: false
    },
    orderBy: {
      startTime: 'desc'
    },
    select: {
      id: true,
      description: true,
      startTime: true,
      endTime: true
    }
  });

  return tasks;
};

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

export const deleteTask = async (taskId: number) => {
  const deletedTask = await prisma.task.update({
    where: {
      id: taskId
    },
    data: {
      isDeleted: true
    }
  });

  return deletedTask;
};
