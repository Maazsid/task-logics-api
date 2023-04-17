import { RegistrationReq } from '../interfaces/auth/registrationReq.model';
import { BcryptEnum } from '../constants/bcryptEnum';
import { RoleEnum } from '../constants/rolesEnum';
import { Role, User } from '@prisma/client';
import prisma from '../utils/db/client';
import { Request } from 'express';
import bcrypt from 'bcrypt';
import otpGenerator from 'otp-generator';
import sendgrid from '@sendgrid/mail';
import { MailDataRequired } from '@sendgrid/helpers/classes/mail';
import jwt from 'jsonwebtoken';
import { LoginReq } from '../interfaces/auth/loginReq.model';

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

export const registerUser = async (req: Request): Promise<User> => {
  const body: RegistrationReq = req?.body;

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

export const isUserExist = async (req: Request): Promise<boolean> => {
  const body: RegistrationReq = req.body;

  const user = await prisma.user.findUnique({
    where: {
      email: body.email
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

  await sendEmail(user, otp);
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
