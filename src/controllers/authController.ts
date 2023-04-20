import { RegistrationReq } from '../interfaces/auth/registrationReq.model';
import { asyncHandler } from '../middlewares/asyncHandler';
import {
  canLoginUser,
  generateOTPToken,
  generateUserAccessToken,
  getUserByEmail,
  getUserById,
  isOTPRequestTimeoutLimitReached,
  isUserExist,
  registerUser,
  renewRefreshToken,
  resetPassword,
  sendOTPToUser
} from '../services/auth';
import {
  forgotPasswordValidator,
  loginValidator,
  registerValidator,
  resetPasswordValidator
} from '../validators/auth.validator';
import passport from 'passport';
import { VerificationTypeEnum } from '../constants/authEnum';
import { LoginReq } from '../interfaces/auth/loginReq.model';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { ForgotPasswordReq } from '../interfaces/auth/forgotPasswordReq.model';
import { ResetPasswordReq } from '../interfaces/auth/resetPasswordReq.model';

export const loginController = asyncHandler(async (req, res) => {
  req.body = {
    ...req.body,
    email: req.body?.email?.trim()
  };

  const body: LoginReq = req.body;

  try {
    await loginValidator.validateAsync(body, {
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

  const { areCredentialsCorrect, user } = await canLoginUser(body);

  if (!areCredentialsCorrect) {
    res.status(400).json({
      success: false,
      error: 'Incorrect credentials.'
    });

    return;
  }

  if (user) {
    const { isOTPRequestLimitReached, message } = await isOTPRequestTimeoutLimitReached(user);

    if (isOTPRequestLimitReached) {
      res.status(400).json({
        success: false,
        message
      });

      return;
    }

    await sendOTPToUser(user);

    const otpJwtToken = generateOTPToken(user);

    res.status(200).json({
      success: true,
      data: {
        message: '',
        result: {
          otpToken: otpJwtToken
        }
      }
    });
  }
});

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

  const isUserAlreadyExist = await isUserExist(body?.email);

  if (isUserAlreadyExist) {
    res.status(400).json({
      success: false,
      data: {
        message: 'User with email already exist.'
      }
    });

    return;
  }

  const user = await registerUser(body);

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
          secure: process.env.NODE_ENV === 'production'
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

export const resendOTPController = asyncHandler(async (req, res) => {
  const otpJwtToken = req?.headers?.authorization?.split(' ')?.[1];

  if (!otpJwtToken) {
    throw new Error('Something went wrong.');
  }

  const decodedToken = jwt.verify(otpJwtToken, process.env.OTP_TOKEN_SECRET as string) as JwtPayload;

  const userId = decodedToken?.userId as any as number;

  const user = await getUserById(userId);

  const { isOTPRequestLimitReached, message } = await isOTPRequestTimeoutLimitReached(user);

  if (isOTPRequestLimitReached) {
    res.status(400).json({
      success: false,
      message
    });

    return;
  }

  await sendOTPToUser(user);

  res.status(200).json({
    success: true,
    message: 'OTP sent successfully!'
  });
});

export const forgotPasswordController = asyncHandler(async (req, res) => {
  req.body = {
    ...req.body,
    email: req.body?.email?.trim()
  };

  const body: ForgotPasswordReq = req.body;

  try {
    await forgotPasswordValidator.validateAsync(body, {
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

  const user = await getUserByEmail(body?.email);

  if (!user) {
    res.status(400).json({
      success: false,
      error: 'Incorrect credentials'
    });

    return;
  }

  await sendOTPToUser(user);

  const otpJwtToken = generateOTPToken(user);

  res.status(200).json({
    success: true,
    data: {
      message: '',
      result: {
        otpToken: otpJwtToken
      }
    }
  });
});

export const resetPasswordController = asyncHandler(async (req, res) => {
  const body: ResetPasswordReq = req.body;

  try {
    await resetPasswordValidator.validateAsync(body, {
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

  const resetPasswordJwtToken = req?.headers?.authorization?.split(' ')?.[1];

  await resetPassword(body, resetPasswordJwtToken);

  res.status(200).json({
    success: true,
    data: {
      message: 'Password reset successfully!'
    }
  });
});

export const refreshTokenController = asyncHandler(async (req, res) => {
  const refreshJwtToken = req?.cookies?.refreshToken;

  if (!refreshJwtToken) {
    throw Error('Something went wrong.');
  }

  let userId: number;

  try {
    const decodedToken = jwt.verify(
      refreshJwtToken,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as JwtPayload;

    userId = decodedToken?.userId as any as number;
  } catch (err) {
    res.status(401).json({
      success: false,
      message: 'Session timed out.'
    });

    return;
  }

  const refreshToken = await renewRefreshToken(userId, refreshJwtToken);

  if (!refreshToken) {
    res.status(401).json({
      success: false,
      message: 'Session timed out.'
    });

    return;
  }

  const accessToken = await generateUserAccessToken(userId);

  const refreshTokenExpiryTime = new Date()?.getTime() + 30 * 24 * 60 * 60 * 1000;
  const refreshTokenExpiryDateUTC = new Date(refreshTokenExpiryTime);

  res
    ?.cookie('refreshToken', refreshToken, {
      expires: refreshTokenExpiryDateUTC,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    })
    ?.status(200)
    ?.json({
      success: true,
      accessToken: accessToken
    });
});

type OtpError = { isAuthenticationError: boolean; message: string };

type OtpResponse = {
  verificationType: VerificationTypeEnum;
  accessToken: string;
  resetPasswordToken: string;
  refreshToken: string;
};
