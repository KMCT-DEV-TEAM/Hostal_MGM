/*
  Warnings:

  - The values [SUPER_ADMIN,ADMIN,WARDEN,MENTOR,ASSISTANT_WARDEN,MAINTENANCE_STAFF] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('super_admin', 'admin', 'warden', 'mentor', 'assistant_warden', 'maintenance_staff');
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "pass_approvals" DROP CONSTRAINT "pass_approvals_action_by_fkey";

-- AlterTable
ALTER TABLE "pass_approvals" ADD COLUMN     "parent_id" UUID,
ALTER COLUMN "action_by" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "pass_approvals" ADD CONSTRAINT "pass_approvals_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pass_approvals" ADD CONSTRAINT "pass_approvals_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
