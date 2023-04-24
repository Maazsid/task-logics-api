/*
  Warnings:

  - Added the required column `expiry_date` to the `user_otp` table without a default value. This is not possible if the table is not empty.
  - Added the required column `otp_attempt` to the `user_otp` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "permissions" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP;

-- AlterTable
ALTER TABLE "roles" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP;

-- AlterTable
ALTER TABLE "tasks" ALTER COLUMN "start_time" SET DATA TYPE TIMESTAMP,
ALTER COLUMN "end_time" SET DATA TYPE TIMESTAMP,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP;

-- AlterTable
ALTER TABLE "user_otp" ADD COLUMN     "expiry_date" TIMESTAMP NOT NULL,
ADD COLUMN     "lockout_date" TIMESTAMP,
ADD COLUMN     "otp_attempt" INTEGER NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP;

-- AlterTable
ALTER TABLE "user_sessions" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP;
