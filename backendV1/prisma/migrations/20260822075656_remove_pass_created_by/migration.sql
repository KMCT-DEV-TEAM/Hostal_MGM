/*
  Warnings:

  - You are about to drop the column `created_by` on the `passes` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "passes" DROP CONSTRAINT "passes_created_by_fkey";

-- AlterTable
ALTER TABLE "passes" DROP COLUMN "created_by";
