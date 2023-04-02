import { ErrorRequestHandler } from 'express';
import { handleError } from '../utils/handleError';

export const errorHandler: ErrorRequestHandler = async (err, req, res, next) => {
  await handleError(err);

  res.status(err?.statusCode || 500).json({
    success: false,
    error: err?.message || 'Something went wrong.'
  });
};
