/*
  Warnings:

  - A unique constraint covering the columns `[id_proof_type,id_proof_number]` on the table `visitors` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "IdProofType" ADD VALUE 'OTHER';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "VisitRequestStatus" ADD VALUE 'REVOKED';
ALTER TYPE "VisitRequestStatus" ADD VALUE 'INACTIVE';
ALTER TYPE "VisitRequestStatus" ADD VALUE 'COMPLETED';
ALTER TYPE "VisitRequestStatus" ADD VALUE 'EXPIRED';
ALTER TYPE "VisitRequestStatus" ADD VALUE 'ACTIVE';
ALTER TYPE "VisitRequestStatus" ADD VALUE 'BLACKLISTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "VisitStatus" ADD VALUE 'EXTENDED';
ALTER TYPE "VisitStatus" ADD VALUE 'COMPLETED';

-- CreateTable
CREATE TABLE "visit_request_timelines" (
    "id" UUID NOT NULL,
    "visit_request_id" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "performed_by" UUID NOT NULL,
    "performed_by_role" VARCHAR(50) NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visit_request_timelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitor_visit_timelines" (
    "id" UUID NOT NULL,
    "visitor_visit_id" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "performed_by" UUID,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitor_visit_timelines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "visit_request_timelines_visit_request_id_idx" ON "visit_request_timelines"("visit_request_id");

-- CreateIndex
CREATE INDEX "visitor_visit_timelines_visitor_visit_id_idx" ON "visitor_visit_timelines"("visitor_visit_id");

-- CreateIndex
CREATE INDEX "visit_requests_visitor_id_student_id_status_idx" ON "visit_requests"("visitor_id", "student_id", "status");

-- CreateIndex
CREATE INDEX "visitors_name_idx" ON "visitors"("name");

-- CreateIndex
CREATE UNIQUE INDEX "visitors_id_proof_type_id_proof_number_key" ON "visitors"("id_proof_type", "id_proof_number");

-- AddForeignKey
ALTER TABLE "visit_request_timelines" ADD CONSTRAINT "visit_request_timelines_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_request_timelines" ADD CONSTRAINT "visit_request_timelines_visit_request_id_fkey" FOREIGN KEY ("visit_request_id") REFERENCES "visit_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_visit_timelines" ADD CONSTRAINT "visitor_visit_timelines_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_visit_timelines" ADD CONSTRAINT "visitor_visit_timelines_visitor_visit_id_fkey" FOREIGN KEY ("visitor_visit_id") REFERENCES "visitor_visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
