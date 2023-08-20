import { NextFunction, Request, Response } from 'express';
import { parsedQueryParamsValidator } from '../validators/parsed-query-params.validator';
import { JoiErrorConfig } from '../constants/joi.const';
import { createResponseBody } from '../utils/utils';
import { ResponseStatusEnum } from '../constants/responseStatusEnum';
import { ParsedQueryParams } from '../interfaces/models/parsed-query-params.model';

export const queryParamsHandler = async (req: Request, res: Response, next: NextFunction) => {
  const { page, pageSize, search } = req.query || {};

  const parsedQueryParams = {
    page: page || '1',
    pageSize: pageSize || '10',
    search: search || ''
  };

  try {
    await parsedQueryParamsValidator.validateAsync(parsedQueryParams, JoiErrorConfig);
  } catch (err: any) {
    res
      .status(400)
      .json(createResponseBody(ResponseStatusEnum.Fail, null, [err?.message || 'Something went wrong.']));

    return;
  }

  req.parsedQueryParams = parsedQueryParams as ParsedQueryParams;

  next();
};
