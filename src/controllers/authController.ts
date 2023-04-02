import { asyncHandler } from '../middlewares/asyncHandler';
import { registerValidator } from '../validators/auth.validator';

export const registerController = asyncHandler(async (req, res, next) => {
  const body = req.body;

  try {
    await registerValidator.validateAsync(body, {
      errors: {
        wrap: {
          label: false
        }
      }
    });
  } catch (err: any) {
    err.isOperational = true;
    next(err);
    return;
  }

  res.status(200).json({
    success: true,
    data: {}
  });
});
