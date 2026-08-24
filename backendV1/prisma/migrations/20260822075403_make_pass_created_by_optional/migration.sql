-- DropForeignKey
ALTER TABLE "passes" DROP CONSTRAINT "passes_created_by_fkey";

-- AlterTable
ALTER TABLE "passes" ALTER COLUMN "created_by" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "passes" ADD CONSTRAINT "passes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
