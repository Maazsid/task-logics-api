import { NextFunction, Request, Response } from 'express';

export const asyncHandler = (fn: RequestCallback) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

type RequestCallback = (req: Request, res: Response, next: NextFunction) => any;
