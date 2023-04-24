import { RegistrationReq } from '../interfaces/auth/registrationReq.model';
import { BcryptEnum } from '../constants/bcryptEnum';
import { RoleEnum } from '../constants/rolesEnum';
import { Role, User } from '@prisma/client';
import prisma from '../utils/db/client';
import bcrypt from 'bcrypt';
import otpGenerator from 'otp-generator';
import sendgrid from '@sendgrid/mail';
import { MailDataRequired } from '@sendgrid/helpers/classes/mail';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { LoginReq } from '../interfaces/auth/loginReq.model';
import { ResetPasswordReq } from '../interfaces/auth/resetPasswordReq.model';

export const canLoginUser = async (
  body: LoginReq
): Promise<{ areCredentialsCorrect: boolean; user?: User }> => {
  const user = await prisma.user.findUnique({
    where: {
      email: body.email
    }
  });

  if (!user) return { areCredentialsCorrect: false };

  const isPasswordMatched = await bcrypt.compare(body?.password, user?.password);

  if (!isPasswordMatched) return { areCredentialsCorrect: false };

  return { areCredentialsCorrect: true, user };
};

export const registerUser = async (body: RegistrationReq): Promise<User> => {
  const hashedPassword = await bcrypt.hash(body?.password, BcryptEnum.SaltRounds);

  const role = (await prisma.role.findFirst({
    where: {
      roleName: RoleEnum.User
    }
  })) as Role;

  const user = await prisma.user.create({
    data: {
      firstName: body?.firstName,
      lastName: body?.lastName,
      email: body?.email,
      password: hashedPassword,
      userRoles: {
        create: [
          {
            roleId: role.id
          }
        ]
      }
    }
  });

  return user;
};

export const resetPassword = async (body: ResetPasswordReq, resetPasswordJwtToken: string | undefined) => {
  if (!resetPasswordJwtToken) {
    throw new Error('Something went wrong.');
  }

  const decodedToken = jwt.verify(
    resetPasswordJwtToken,
    process.env.RESET_PASSWORD_TOKEN_SECRET as string
  ) as JwtPayload;

  const userId = decodedToken?.userId as any as number;

  const hashedPassword = await bcrypt.hash(body?.password, BcryptEnum.SaltRounds);

  await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      password: hashedPassword
    }
  });
};

export const isUserExist = async (email: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: {
      email: email
    }
  });

  if (user) return true;
  return false;
};

export const isOTPRequestTimeoutLimitReached = async (
  user: User
): Promise<{ isOTPRequestLimitReached: boolean; message: string }> => {
  const userOtp = await prisma.userOtp.findFirst({
    where: {
      userId: user?.id
    }
  });

  if (!userOtp) return { isOTPRequestLimitReached: false, message: '' };

  const isOtpRequestTimedout = userOtp?.otpRequest === 100;
  const isOtpTimeoutRemaining =
    new Date(userOtp?.otpRequestTimeoutDate || '').getTime() > new Date().getTime();

  if (isOtpRequestTimedout && isOtpTimeoutRemaining) {
    const currentDate = new Date().getTime();
    const otpTimeoutDate = new Date(userOtp.otpRequestTimeoutDate || '').getTime();
    const remainingTime = Math.ceil((otpTimeoutDate - currentDate) / 1000 / 60 / 60);
    const message = `OTP request limit reached, time remaining: ${remainingTime} hours`;

    return { isOTPRequestLimitReached: true, message };
  } else if (isOtpRequestTimedout && !isOtpTimeoutRemaining) {
    await prisma.userOtp.update({
      where: {
        userId: user?.id
      },
      data: {
        otpRequest: 0,
        otpRequestTimeoutDate: null
      }
    });
  }

  return { isOTPRequestLimitReached: false, message: '' };
};

export const sendOTPToUser = async (user: User) => {
  const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
  const expiryTime = Date.now() + 5 * 60 * 1000;
  const expiryDate = new Date(expiryTime);
  const expiryDateUTC = expiryDate.toISOString();

  const userOtp = await prisma.userOtp.findFirst({
    where: {
      userId: user.id
    }
  });

  if (userOtp) {
    const isOTPRequestLimitReached = userOtp.otpRequest + 1 === 100;
    let otpRequestTimeoutDateUTC: string | null = null;

    if (isOTPRequestLimitReached) {
      const otpReqTimeout = Date.now() + 24 * 60 * 60 * 1000;
      const otpReqTimeoutDate = new Date(otpReqTimeout);
      otpRequestTimeoutDateUTC = otpReqTimeoutDate.toISOString();
    }

    await prisma.userOtp.update({
      where: {
        userId: user.id
      },
      data: {
        otp: otp,
        expiryDate: expiryDateUTC,
        otpRequest: userOtp.otpRequest + 1,
        otpRequestTimeoutDate: otpRequestTimeoutDateUTC
      }
    });
  } else {
    await prisma.userOtp.create({
      data: {
        userId: user.id,
        otp: otp,
        expiryDate: expiryDateUTC,
        otpRequest: 1
      }
    });
  }

  if (process.env.SEND_GRID_ENABLED === 'true') {
    await sendEmail(user, otp);
  }
};

export const renewRefreshToken = async (userId: number, refreshJwtToken: string): Promise<string | null> => {
  const userSession = await prisma.userSession.findFirst({
    where: {
      userId: userId,
      refreshToken: refreshJwtToken
    },
    select: {
      id: true,
      isRevoked: true
    }
  });

  if (!userSession) return null;

  if (userSession?.isRevoked) return null;

  const refreshToken = await generateUserRefreshToken(userId);

  await prisma.userSession.delete({
    where: {
      id: userSession.id
    }
  });

  return refreshToken;
};

export const generateOTPToken = (user: User): string => {
  const token = jwt.sign({ userId: user.id }, process.env.OTP_TOKEN_SECRET as string, {
    expiresIn: 15 * 60
  });

  return token;
};

export const getUserById = async (userId: number): Promise<User> => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    }
  });

  if (!user) throw new Error('Something went wrong.');

  return user;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const user = await prisma.user.findUnique({
    where: {
      email
    }
  });

  return user;
};

export const generateUserAccessToken = async (userId: number): Promise<string> => {
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

export const generateUserRefreshToken = async (userId: number): Promise<string> => {
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

const sendEmail = async (user: User, otp: string) => {
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error(
      "The SENDGRID_API_KEY env var must be set, otherwise the API won't be able to send emails."
    );
  }

  sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

  const fullName = `${user?.firstName} ${user?.lastName}`;

  const emailMessage: MailDataRequired = {
    from: 'maaz.d.sid@gmail.com',
    templateId: process.env.SENDGRID_OTP_TEMPlATE_ID as string,
    personalizations: [
      {
        to: user?.email,
        dynamicTemplateData: {
          otp: otp,
          fullName: fullName
        }
      }
    ]
  };

  await sendgrid.send(emailMessage);
};
