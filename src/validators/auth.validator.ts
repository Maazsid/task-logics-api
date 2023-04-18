import Joi from 'joi';
import { VerificationTypeEnum } from '../constants/authEnum';

/* 
  Password Validation
  At least one upper case English letter, (?=.*?[A-Z])
  At least one lower case English letter, (?=.*?[a-z])
  At least one digit, (?=.*?[0-9])
  At least one special character, (?=.*?[#?!@$%^&*-])
  Minimum eight in length .{8,} (with the anchors)
*/

const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;

export const loginValidator = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required().pattern(passwordRegex)
});

export const registerValidator = Joi.object({
  firstName: Joi.string().min(3).max(100).required(),
  lastName: Joi.string().min(3).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().required().pattern(passwordRegex)
});

export const forgotPasswordValidator = Joi.object({
  email: Joi.string().email().required()
});

export const otpValidator = Joi.object({
  otp: Joi.string().required(),
  verificationType: Joi.string()
    .required()
    .valid(...Object.values(VerificationTypeEnum))
});
