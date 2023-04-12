import { RegistrationReq } from '../interfaces/auth/registrationReq.model';
import { BcryptEnum } from '../constants/bcryptEnum';
import { RoleEnum } from '../constants/rolesEnum';
import { Role, User } from '@prisma/client';
import prisma from '../utils/client';
import { Request } from 'express';
import bcrypt from 'bcrypt';
import otpGenerator from 'otp-generator';
import sendgrid from '@sendgrid/mail';
import { MailDataRequired } from '@sendgrid/helpers/classes/mail';
import jwt from 'jsonwebtoken';

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
      const otpReqTimeout = Date.now() + 60 * 60 * 1000;
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
  }

  await prisma.userOtp.create({
    data: {
      userId: user.id,
      otp: otp,
      expiryDate: expiryDateUTC,
      otpRequest: 1
    }
  });

  await sendEmail(user, otp);
};

export const generateOTPToken = (user: User): string => {
  const token = jwt.sign({ userId: user.id }, process.env.OTP_TOKEN_SECRET as string, {
    expiresIn: 15 * 60
  });

  return token;
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
