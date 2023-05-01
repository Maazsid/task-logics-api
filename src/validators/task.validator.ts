import Joi from 'joi';

export const addTaskValidator = Joi.object({
  description: Joi.string().required().max(30000)
});

