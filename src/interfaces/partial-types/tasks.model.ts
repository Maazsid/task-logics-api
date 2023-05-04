import { Prisma } from '@prisma/client';

export type GetTasks = Prisma.TaskGetPayload<{
  select: {
    id: true;
    description: true;
    startTime: true;
    endTime: true;
  };
}>;
