import { ErrorRequestHandler } from 'express';
import { handleError } from '../utils/handleError';
import { createResponseBody } from '../utils/utils';
import { ResponseStatusEnum } from '../constants/responseStatusEnum';

export const errorHandler: ErrorRequestHandler = async (err, req, res, next) => {
  await handleError(err);

  res
    .status(err?.statusCode || 500)
    .json(createResponseBody(ResponseStatusEnum.Error, null, ['Something went wrong.']));
};
