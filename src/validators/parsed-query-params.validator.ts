import Joi from 'joi';

export const parsedQueryParamsValidator = Joi.object({
  page: Joi.number().integer(),
  pageSize: Joi.number().integer(),
  search: Joi.string().allow('')
});
