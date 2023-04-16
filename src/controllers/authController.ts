import { RegistrationReq } from '../interfaces/auth/registrationReq.model';
import { asyncHandler } from '../middlewares/asyncHandler';
import { generateOTPToken, isUserExist, registerUser, sendOTPToUser } from '../services/auth';
import { registerValidator } from '../validators/auth.validator';
import passport from 'passport';
import { VerificationTypeEnum } from '../constants/authEnum';

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

  const otpJwtToken = generateOTPToken(user);

  res.status(200).json({
    success: true,
    data: {
      message: 'User registered successfully!',
      result: {
        otpToken: otpJwtToken
      }
    }
  });
});

export const verifyOTPController = asyncHandler(async (req, res, next) => {
  passport.authenticate('otpStragety', (err: OtpError, otpResponse: OtpResponse, info: any) => {
    if (otpResponse?.verificationType === VerificationTypeEnum.Login) {
      const refreshTokenExpiryTime = new Date()?.getTime() + 30 * 24 * 60 * 60 * 1000;
      const refreshTokenExpiryDateUTC = new Date(refreshTokenExpiryTime);

      res
        ?.cookie('refreshToken', otpResponse?.refreshToken, {
          expires: refreshTokenExpiryDateUTC,
          httpOnly: true,
          secure: true
        })
        ?.status(200)
        ?.json({
          success: true,
          accessToken: otpResponse?.accessToken
        });

      return;
    } else if (otpResponse?.verificationType === VerificationTypeEnum.ForgotPassword) {
      res.status(200).json({
        success: true,
        resetPasswordToken: otpResponse?.resetPasswordToken
      });

      return;
    }

    if (info) {
      res.status(400).json({
        success: false,
        message: 'OTP is required.'
      });

      return;
    }

    if (err?.isAuthenticationError) {
      res.status(400).json({
        success: false,
        message: err?.message
      });

      return;
    } else {
      next(err);
    }
  })(req, res, next);
});

type OtpError = { isAuthenticationError: boolean; message: string };

type OtpResponse = {
  verificationType: VerificationTypeEnum;
  accessToken: string;
  resetPasswordToken: string;
  refreshToken: string;
};
