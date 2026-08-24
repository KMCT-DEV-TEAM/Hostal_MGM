-- CreateEnum
CREATE TYPE "PassTimelineAction" AS ENUM ('created', 'updated', 'parent_approved', 'parent_rejected', 'admin_approved', 'admin_rejected', 'admin_cancelled', 'warden_marked_out', 'warden_marked_returned', 'student_edited_leave', 'parent_edited_leave', 'approval_reset', 'student_cancelled_request', 'parent_cancelled_request', 'cancelled', 'returned', 'completed', 'hostel_transferred');

-- CreateTable
CREATE TABLE "pass_timelines" (
    "id" UUID NOT NULL,
    "pass_id" UUID NOT NULL,
    "action" "PassTimelineAction" NOT NULL,
    "actor_id" UUID NOT NULL,
    "actor_role" VARCHAR(50) NOT NULL,
    "old_hostel_id" UUID,
    "new_hostel_id" UUID,
    "remarks" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pass_timelines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pass_timelines_pass_id_idx" ON "pass_timelines"("pass_id");

-- CreateIndex
CREATE INDEX "pass_timelines_actor_id_idx" ON "pass_timelines"("actor_id");

-- CreateIndex
CREATE INDEX "pass_timelines_timestamp_idx" ON "pass_timelines"("timestamp");

-- AddForeignKey
ALTER TABLE "pass_timelines" ADD CONSTRAINT "pass_timelines_pass_id_fkey" FOREIGN KEY ("pass_id") REFERENCES "passes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pass_timelines" ADD CONSTRAINT "pass_timelines_old_hostel_id_fkey" FOREIGN KEY ("old_hostel_id") REFERENCES "hostels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pass_timelines" ADD CONSTRAINT "pass_timelines_new_hostel_id_fkey" FOREIGN KEY ("new_hostel_id") REFERENCES "hostels"("id") ON DELETE SET NULL ON UPDATE CASCADE;
