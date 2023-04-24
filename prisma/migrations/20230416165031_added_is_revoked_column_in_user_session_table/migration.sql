/*
  Warnings:

  - Added the required column `is_revoked` to the `user_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user_sessions" ADD COLUMN     "is_revoked" BOOLEAN NOT NULL;
