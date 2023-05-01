import Joi from 'joi';

export const addTaskValidator = Joi.object({
  description: Joi.string().required().max(30000),
  startTime: Joi.string().required()
});

export const updateTaskValidator = Joi.object({
  description: Joi.string().max(30000),
  startTime: Joi.string(),
  endTime: Joi.string()
});
