import { RegistrationReq } from '../interfaces/auth/registrationReq.model';
import { asyncHandler } from '../middlewares/asyncHandler';
import { generateResendOTPToken, isUserExist, registerUser, sendOTPToUser } from '../services/auth';
import { registerValidator } from '../validators/auth.validator';

export const registerController = asyncHandler(async (req, res) => {
  req.body = {
    ...req.body,
    firstName: req.body?.firstName?.trim(),
    lastName: req.body?.lastName?.trim(),
    email: req.body?.email?.trim()
  };

  const body: RegistrationReq = req.body;

  try {
    await registerValidator.validateAsync(body, {
      errors: {
        wrap: {
          label: false
        }
      }
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err?.message || 'Something went wrong.'
    });

    return;
  }

  const isUserAlreadyExist = await isUserExist(req);

  if (isUserAlreadyExist) {
    res.status(400).json({
      success: false,
      data: {
        message: 'User with email already exist.'
      }
    });

    return;
  }

  const user = await registerUser(req);

  await sendOTPToUser(user);

  const resendOTPToken = generateResendOTPToken(user);

  res.status(200).json({
    success: true,
    data: {
      message: 'User registered successfully!',
      result: {
        resendOTPToken
      }
    }
  });
});
