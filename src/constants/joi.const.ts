import { AsyncValidationOptions } from 'joi';

export const JoiErrorConfig: AsyncValidationOptions = {
  errors: {
    wrap: {
      label: false
    }
  }
};
