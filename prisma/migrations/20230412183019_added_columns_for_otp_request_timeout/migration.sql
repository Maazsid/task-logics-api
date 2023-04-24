/*
  Warnings:

  - Added the required column `otp_request` to the `user_otp` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user_otp" ADD COLUMN     "otp_request" INTEGER NOT NULL,
ADD COLUMN     "otp_request_timeout_date" TIMESTAMP,
ALTER COLUMN "otp_attempt" DROP NOT NULL;
