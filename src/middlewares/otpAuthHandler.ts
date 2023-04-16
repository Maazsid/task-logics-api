import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { VerificationTypeEnum } from '../constants/authEnum';

export const otpAuthHandler = async (req: Request, res: Response, next: NextFunction) => {
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
};

type OtpError = { isAuthenticationError: boolean; message: string };

type OtpResponse = {
  verificationType: VerificationTypeEnum;
  accessToken: string;
  resetPasswordToken: string;
  refreshToken: string;
};
