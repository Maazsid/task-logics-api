import { NextFunction, Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';

export const register = asyncHandler((req: Request, res: Response, next: NextFunction) => {
  next();
});
