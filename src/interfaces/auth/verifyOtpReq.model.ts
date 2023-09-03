import { VerificationTypeEnum } from '../../constants/auth/verificationTypeEnum';

export interface VerifyOtpReq {
  otp: string;
  verificationType: VerificationTypeEnum;
}
