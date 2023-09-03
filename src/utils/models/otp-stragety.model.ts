import { VerificationTypeEnum } from '../../constants/auth/verificationTypeEnum';

export interface OtpStragety {
  verificationType: VerificationTypeEnum;
  accessToken: string;
  resetPasswordToken: string;
  refreshToken: string;
}

export interface OtpError {
  isAuthenticationError: boolean;
  message: string;
}
