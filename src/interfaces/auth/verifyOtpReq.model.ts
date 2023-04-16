import { VerificationTypeEnum } from '../../constants/authEnum';

export interface VerifyOtpReq {
  otp: string;
  verificationType: VerificationTypeEnum;
}
