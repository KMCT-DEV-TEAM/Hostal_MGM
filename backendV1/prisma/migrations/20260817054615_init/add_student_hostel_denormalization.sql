-- ============================================================
-- Migration: add_student_hostel_denormalization
-- 
-- Purpose:
--   Adds three denormalized hostel state fields to the students table.
--   These mirror the MongoDB fields:
--     student.hostelId    → current_hostel_id
--     student.roomNumber  → current_room_number
--     student.hostelStatus → hostel_status
--
--   These fields are updated atomically inside the StudentHostel
--   allocation transaction to preserve the MongoDB dual-write behavior.
--
--   Also converts StudentHostelStatus to lowercase to match MongoDB exact strings.
--
-- Apply with: prisma migrate resolve --applied <name>
--   after running this SQL directly against the database.
-- ============================================================

-- Create the enum for student hostel status (MongoDB-compatible values)
CREATE TYPE "StudentCurrentHostelStatus" AS ENUM ('active', 'inactive');

-- Update the existing StudentHostelStatus enum to use lowercase (MongoDB strings)
ALTER TYPE "StudentHostelStatus" RENAME VALUE 'ALLOCATED' TO 'active';
ALTER TYPE "StudentHostelStatus" RENAME VALUE 'VACATED' TO 'vacated';
ALTER TYPE "StudentHostelStatus" RENAME VALUE 'TRANSFERRED' TO 'transferred';
ALTER TYPE "StudentHostelStatus" ADD VALUE 'cancelled';

-- Add the three denormalized columns to students table
ALTER TABLE "students"
  ADD COLUMN "current_hostel_id"   UUID,
  ADD COLUMN "current_room_number" VARCHAR(50),
  ADD COLUMN "hostel_status"       "StudentCurrentHostelStatus" NOT NULL DEFAULT 'inactive';

-- Index for fast lookup of students currently in a hostel
CREATE INDEX "students_current_hostel_id_idx" ON "students"("current_hostel_id");
