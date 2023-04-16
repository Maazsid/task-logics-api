import { Strategy } from 'passport-local';
import { otpValidator } from '../../validators/auth.validator';
import { VerifyOtpReq } from '../../interfaces/auth/verifyOtpReq.model';
import prisma from '../db/client';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { VerificationTypeEnum } from '../../constants/authEnum';

export const otpStragety = new Strategy(
  { usernameField: 'otp', passwordField: 'otp', passReqToCallback: true },
  async (req, username, password, done) => {
    try {
      const otpJwtToken = req?.headers?.authorization?.split(' ')?.[1];

      if (!otpJwtToken) {
        throw new Error('Something went wrong.');
      }

      let userId: number;

      try {
        const decodedToken = jwt.verify(otpJwtToken, process.env.OTP_TOKEN_SECRET as string) as JwtPayload;
        userId = decodedToken?.userId as any as number;
      } catch (err) {
        done(err);
        return;
      }

      const body: VerifyOtpReq = req.body;

      try {
        await otpValidator.validateAsync(body, {
          errors: {
            wrap: {
              label: false
            }
          }
        });
      } catch (err: any) {
        done({
          isAuthenticationError: true,
          message: err?.message
        });
        return;
      }

      const { otp, verificationType } = body || {};

      const userOtp = await prisma.userOtp.findFirst({
        where: {
          userId: userId
        }
      });

      const isUserOTPExist = !!userOtp;

      if (!isUserOTPExist) {
        throw new Error('User OTP does not exist.');
      }

      const isUserAccountLockedOut = userOtp?.otpAttempt === 10;
      const isLockoutTimeRemaining = new Date(userOtp.lockoutDate || '').getTime() > new Date().getTime();

      if (isUserAccountLockedOut && isLockoutTimeRemaining) {
        const currentDate = new Date().getTime();
        const lockoutDate = new Date(userOtp.lockoutDate || '').getTime();
        const remainingTime = Math.ceil((lockoutDate - currentDate) / 1000 / 60);
        const message = `Too many attempts, account is locked out for ${remainingTime} minutes.`;
        done({ isAuthenticationError: true, message });

        return;
      } else if (isUserAccountLockedOut && !isLockoutTimeRemaining) {
        await prisma.userOtp.update({
          where: {
            userId: userId
          },
          data: {
            otpAttempt: 0,
            lockoutDate: null
          }
        });

        userOtp.otpAttempt = 0;
      }

      const isUserOTPNotValid = userOtp.otp !== otp;
      const isUserOTPExpired = new Date().getTime() > new Date(userOtp?.expiryDate)?.getTime();

      if (isUserOTPNotValid || isUserOTPExpired) {
        const updatedOtpAttempts = (userOtp?.otpAttempt ?? 0) + 1;
        const isOTPAttemptLimitReached = updatedOtpAttempts === 10;

        let otpAttemptTimeoutDateUTC: string | null = null;

        if (isOTPAttemptLimitReached) {
          const otpAttemptTimeout = Date.now() + 60 * 60 * 1000;
          const otpAttemptTimeoutDate = new Date(otpAttemptTimeout);
          otpAttemptTimeoutDateUTC = otpAttemptTimeoutDate.toISOString();
        }

        await prisma.userOtp.update({
          where: {
            userId: userId
          },
          data: {
            otpAttempt: updatedOtpAttempts,
            lockoutDate: otpAttemptTimeoutDateUTC
          }
        });

        done({
          isAuthenticationError: true,
          message: 'OTP is not valid.'
        });

        return;
      }

      await prisma.userOtp.delete({
        where: {
          id: userOtp?.id
        }
      });

      if (verificationType === VerificationTypeEnum.Login) {
        const accessToken = await generateUserAccessToken(userId);
        const refreshToken = await generateUserRefreshToken(userId);

        done(null, { verificationType: VerificationTypeEnum.Login, refreshToken, accessToken });
      } else {
        const resetPasswordToken = jwt.sign(
          { userId: userId },
          process.env.RESET_PASSWORD_TOKEN_SECRET as string,
          {
            expiresIn: 15 * 60
          }
        );

        done(null, {
          verificationType: VerificationTypeEnum.ForgotPassword,
          resetPasswordToken
        });
      }
    } catch (err) {
      done(err);
    }
  }
);

const generateUserAccessToken = async (userId: number): Promise<string> => {
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId
    },
    select: {
      roleId: true
    }
  });

  const userRolesIds = userRoles?.map((userRole) => userRole?.roleId);

  const rolePermissions = await prisma.rolePermission.findMany({
    where: {
      roleId: {
        in: userRolesIds
      }
    },
    include: {
      permission: true
    }
  });

  const userPermissions = rolePermissions?.map((rolePermission) => {
    const { permission } = rolePermission || {};
    const { resource, canCreate, canRead, canUpdate, canDelete } = permission || {};
    return {
      resource,
      canCreate,
      canRead,
      canUpdate,
      canDelete
    };
  });

  const accessToken = jwt.sign(
    { userId: userId, permissions: userPermissions },
    process.env.ACCESS_TOKEN_SECRET as string,
    {
      expiresIn: 15 * 60
    }
  );

  return accessToken;
};

const generateUserRefreshToken = async (userId: number): Promise<string> => {
  const refreshToken = jwt.sign({ userId: userId }, process.env.REFRESH_TOKEN_SECRET as string, {
    expiresIn: 30 * 24 * 60 * 60
  });

  await prisma.userSession.create({
    data: {
      userId: userId,
      refreshToken: refreshToken,
      isRevoked: false
    }
  });

  return refreshToken;
};

declare module 'jsonwebtoken' {
  export interface JwtPayload {
    userId: string;
  }
}
