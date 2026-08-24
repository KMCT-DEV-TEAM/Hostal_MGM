-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED', 'READ');

-- CreateEnum
CREATE TYPE "HostelType" AS ENUM ('BOYS', 'GIRLS');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'WARDEN', 'MENTOR', 'ASSISTANT_WARDEN', 'MAINTENANCE_STAFF');

-- CreateEnum
CREATE TYPE "PassType" AS ENUM ('home_pass', 'out_pass');

-- CreateEnum
CREATE TYPE "OutPassCategory" AS ENUM ('in_house', 'out_house');

-- CreateEnum
CREATE TYPE "PassStatus" AS ENUM ('pending_parent', 'pending_admin', 'approved', 'rejected', 'cancelled', 'completed', 'returned');

-- CreateEnum
CREATE TYPE "ApprovalLevel" AS ENUM ('PARENT', 'ADMIN', 'WARDEN');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "GateEventType" AS ENUM ('LEFT', 'RETURNED');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'AWAITING', 'RESOLVED', 'REJECTED', 'INCOMPLETE');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "TargetType" AS ENUM ('GENERAL', 'ORGANIZATION', 'HOSTEL');

-- CreateEnum
CREATE TYPE "AnnouncementStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'EXPIRED', 'DELETED');

-- CreateEnum
CREATE TYPE "IdProofType" AS ENUM ('AADHAAR', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID', 'PAN');

-- CreateEnum
CREATE TYPE "VisitorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLACKLISTED', 'DELETED');

-- CreateEnum
CREATE TYPE "VisitRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('CHECKED_IN', 'CHECKED_OUT', 'OVERSTAYED');

-- CreateEnum
CREATE TYPE "FurnitureStatus" AS ENUM ('AVAILABLE', 'ALLOCATED', 'MAINTENANCE', 'INACTIVE', 'LOST', 'SCRAP');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'SYSTEM', 'ALERT');

-- CreateEnum
CREATE TYPE "StudentHostelStatus" AS ENUM ('active', 'vacated', 'transferred', 'cancelled');

-- CreateEnum
CREATE TYPE "MentorAssignmentStatus" AS ENUM ('ACTIVE', 'TRANSFERRED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceWindowStatus" AS ENUM ('OPEN', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'ON_LEAVE');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('SUCCESS', 'ERROR', 'WARNING');

-- CreateEnum
CREATE TYPE "ParentRelationship" AS ENUM ('father', 'mother', 'guardian', 'other');

-- CreateEnum
CREATE TYPE "ParentStatus" AS ENUM ('active', 'inactive');

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "organisation_number" VARCHAR(100) NOT NULL,
    "admin_id" UUID,
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostels" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "location" TEXT,
    "capacity" INTEGER,
    "hostel_type" "HostelType" NOT NULL,
    "admin_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "hostels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_organizations" (
    "id" UUID NOT NULL,
    "hostel_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,

    CONSTRAINT "hostel_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_wardens" (
    "id" UUID NOT NULL,
    "hostel_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "hostel_wardens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "organization_id" UUID NOT NULL,
    "departments_count" INTEGER NOT NULL DEFAULT 0,
    "batches_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "course_id" UUID NOT NULL,
    "batches_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batches" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "department_id" UUID NOT NULL,
    "start_year" INTEGER NOT NULL,
    "end_year" INTEGER NOT NULL,
    "students_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "organization_id" UUID,
    "employee_code" VARCHAR(50),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "temp_password" BOOLEAN NOT NULL DEFAULT false,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "lock_until" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "settings" JSONB,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" UUID NOT NULL,
    "admission_no" VARCHAR(50) NOT NULL,
    "organization_id" UUID NOT NULL,
    "course_id" UUID,
    "department_id" UUID,
    "batch_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" TEXT NOT NULL,
    "temp_password" BOOLEAN NOT NULL DEFAULT false,
    "phone" VARCHAR(20),
    "gender" VARCHAR(20),
    "dob" DATE,
    "academic_year" VARCHAR(50),
    "address" TEXT,
    "settings" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "joining_date" DATE,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "lock_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parents" (
    "id" UUID NOT NULL,
    "parent_name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255),
    "password" TEXT NOT NULL,
    "temp_password" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "lock_until" TIMESTAMP(3),
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "device_id" TEXT,
    "device_name" TEXT,
    "browser" TEXT,
    "operating_system" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "organization_id" UUID,
    "user_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "module" VARCHAR(100) NOT NULL,
    "entity_id" UUID,
    "old_data" JSONB,
    "new_data" JSONB,
    "ip_address" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_parents" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "parent_id" UUID NOT NULL,
    "default_guardian" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "relationship" "ParentRelationship" NOT NULL DEFAULT 'guardian',
    "status" "ParentStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "student_parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_hostels" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "hostel_id" UUID NOT NULL,
    "room_number" VARCHAR(50) NOT NULL,
    "status" "StudentHostelStatus" NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL,
    "vacated_at" TIMESTAMP(3),
    "allocated_by" UUID NOT NULL,
    "vacated_by" UUID,
    "reason" TEXT,
    "remarks" TEXT,
    "previous_allocation_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_hostels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_assignments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "mentor_id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "status" "MentorAssignmentStatus" NOT NULL,
    "assigned_by" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentor_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_windows" (
    "id" UUID NOT NULL,
    "hostel_id" UUID NOT NULL,
    "attendance_date" DATE NOT NULL,
    "total_students" INTEGER NOT NULL DEFAULT 0,
    "scanned_count" INTEGER NOT NULL DEFAULT 0,
    "present_count" INTEGER NOT NULL DEFAULT 0,
    "absent_count" INTEGER NOT NULL DEFAULT 0,
    "on_leave_count" INTEGER NOT NULL DEFAULT 0,
    "status" "AttendanceWindowStatus" NOT NULL,
    "started_by" UUID NOT NULL,
    "completed_by" UUID,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_windows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" UUID NOT NULL,
    "attendance_window_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "hostel_id" UUID NOT NULL,
    "scanned_by" UUID NOT NULL,
    "scanned_at" TIMESTAMP(3),
    "status" "AttendanceStatus" NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_corrections" (
    "id" UUID NOT NULL,
    "attendance_record_id" UUID NOT NULL,
    "previous_status" "AttendanceStatus",
    "new_status" "AttendanceStatus",
    "remarks" TEXT,
    "corrected_by" UUID NOT NULL,
    "corrected_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_corrections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passes" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "hostel_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "parent_id" UUID NOT NULL,
    "pass_type" "PassType" NOT NULL,
    "out_pass_category" "OutPassCategory",
    "reason" TEXT NOT NULL,
    "from_date" TIMESTAMP(3),
    "to_date" TIMESTAMP(3),
    "expected_return_at" TIMESTAMP(3),
    "status" "PassStatus" NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "passes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pass_approvals" (
    "id" UUID NOT NULL,
    "pass_id" UUID NOT NULL,
    "approval_level" "ApprovalLevel" NOT NULL,
    "status" "ApprovalStatus" NOT NULL,
    "action_by" UUID NOT NULL,
    "remarks" TEXT,
    "action_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pass_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pass_gate_logs" (
    "id" UUID NOT NULL,
    "pass_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "event_type" "GateEventType" NOT NULL,
    "event_time" TIMESTAMP(3) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "recorded_by" UUID NOT NULL,
    "remarks" TEXT,
    "is_corrected" BOOLEAN NOT NULL DEFAULT false,
    "corrected_by" UUID,
    "corrected_at" TIMESTAMP(3),
    "correction_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pass_gate_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaint_categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "complaint_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaints" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "hostel_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "room_no" VARCHAR(50) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "assigned_staff" UUID,
    "materials_used" TEXT,
    "resolution_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "created_by" UUID NOT NULL,
    "creator_role" VARCHAR(50) NOT NULL,
    "target_type" "TargetType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "status" "AnnouncementStatus" NOT NULL DEFAULT 'ACTIVE',
    "scheduled_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_organizations" (
    "id" UUID NOT NULL,
    "announcement_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,

    CONSTRAINT "announcement_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_hostels" (
    "id" UUID NOT NULL,
    "announcement_id" UUID NOT NULL,
    "hostel_id" UUID NOT NULL,

    CONSTRAINT "announcement_hostels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitors" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255),
    "id_proof_type" "IdProofType" NOT NULL,
    "id_proof_number" VARCHAR(100) NOT NULL,
    "address" TEXT,
    "photo_url" TEXT,
    "status" "VisitorStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "visitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitor_change_logs" (
    "id" UUID NOT NULL,
    "visitor_id" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "performed_by" UUID NOT NULL,
    "performed_by_role" VARCHAR(20) NOT NULL,
    "reason" TEXT,
    "timestamp" TIMESTAMP(3),

    CONSTRAINT "visitor_change_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visit_requests" (
    "id" UUID NOT NULL,
    "visitor_id" UUID NOT NULL,
    "parent_id" UUID,
    "student_id" UUID NOT NULL,
    "relationship" VARCHAR(50) NOT NULL,
    "purpose" VARCHAR(255) NOT NULL,
    "status" "VisitRequestStatus" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visit_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitor_visits" (
    "id" UUID NOT NULL,
    "visitor_ref_id" UUID NOT NULL,
    "visitor_ref_type" VARCHAR(20) NOT NULL,
    "hostel_id" UUID NOT NULL,
    "purpose" VARCHAR(255) NOT NULL,
    "status" "VisitStatus" NOT NULL DEFAULT 'CHECKED_IN',
    "check_in_time" TIMESTAMP(3) NOT NULL,
    "expected_exit_time" TIMESTAMP(3) NOT NULL,
    "check_out_time" TIMESTAMP(3),
    "checked_in_by" UUID,
    "checked_out_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitor_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitor_visit_students" (
    "id" UUID NOT NULL,
    "visitor_visit_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,

    CONSTRAINT "visitor_visit_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "furniture_types" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "hostel_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "prefix" VARCHAR(10) NOT NULL,
    "description" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "furniture_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "furniture_assets" (
    "id" UUID NOT NULL,
    "furniture_id" VARCHAR(50) NOT NULL,
    "furniture_type_id" UUID NOT NULL,
    "student_id" UUID,
    "status" "FurnitureStatus" NOT NULL DEFAULT 'AVAILABLE',
    "remarks" TEXT,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "furniture_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "furniture_asset_histories" (
    "id" UUID NOT NULL,
    "furniture_asset_id" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "previous_status" "FurnitureStatus",
    "current_status" "FurnitureStatus",
    "performed_by" UUID,
    "performed_by_role" VARCHAR(50),
    "student_id" UUID,
    "remarks" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "furniture_asset_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "recipient_id" UUID NOT NULL,
    "recipient_model" VARCHAR(20) NOT NULL,
    "recipient_snapshot_name" VARCHAR(255),
    "recipient_snapshot_role" VARCHAR(50),
    "sender_id" UUID,
    "sender_model" VARCHAR(20),
    "sender_snapshot_name" VARCHAR(255),
    "sender_snapshot_role" VARCHAR(50),
    "event_type" VARCHAR(100) NOT NULL,
    "event_category" VARCHAR(100) NOT NULL,
    "event_priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "event_type_label" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "delivery_email_attempts" INTEGER NOT NULL DEFAULT 0,
    "delivery_email_read_at" TIMESTAMP(3),
    "delivery_email_sent_at" TIMESTAMP(3),
    "delivery_email_status" "NotificationStatus",
    "delivery_in_app_attempts" INTEGER NOT NULL DEFAULT 0,
    "delivery_in_app_read_at" TIMESTAMP(3),
    "delivery_in_app_sent_at" TIMESTAMP(3),
    "delivery_in_app_status" "NotificationStatus",
    "delivery_push_attempts" INTEGER NOT NULL DEFAULT 0,
    "delivery_push_read_at" TIMESTAMP(3),
    "delivery_push_sent_at" TIMESTAMP(3),
    "delivery_push_status" "NotificationStatus",

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" UUID NOT NULL,
    "recipient_id" UUID NOT NULL,
    "recipient_model" VARCHAR(20) NOT NULL,
    "endpoint" TEXT NOT NULL,
    "key_p256dh" TEXT NOT NULL,
    "key_auth" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "inactive_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otps" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "otp" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "new_password" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID,
    "user_id" UUID NOT NULL,
    "user_role" VARCHAR(50) NOT NULL,
    "details" TEXT NOT NULL,
    "status" "ActionStatus" NOT NULL DEFAULT 'SUCCESS',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_code_key" ON "organizations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_organisation_number_key" ON "organizations"("organisation_number");

-- CreateIndex
CREATE INDEX "organizations_admin_id_idx" ON "organizations"("admin_id");

-- CreateIndex
CREATE INDEX "organizations_is_active_idx" ON "organizations"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "hostels_code_key" ON "hostels"("code");

-- CreateIndex
CREATE INDEX "hostels_admin_id_idx" ON "hostels"("admin_id");

-- CreateIndex
CREATE INDEX "hostels_is_active_idx" ON "hostels"("is_active");

-- CreateIndex
CREATE INDEX "hostel_organizations_hostel_id_idx" ON "hostel_organizations"("hostel_id");

-- CreateIndex
CREATE INDEX "hostel_organizations_organization_id_idx" ON "hostel_organizations"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_organizations_hostel_id_organization_id_key" ON "hostel_organizations"("hostel_id", "organization_id");

-- CreateIndex
CREATE INDEX "hostel_wardens_hostel_id_idx" ON "hostel_wardens"("hostel_id");

-- CreateIndex
CREATE INDEX "hostel_wardens_user_id_idx" ON "hostel_wardens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_wardens_hostel_id_user_id_key" ON "hostel_wardens"("hostel_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");

-- CreateIndex
CREATE INDEX "courses_organization_id_idx" ON "courses"("organization_id");

-- CreateIndex
CREATE INDEX "courses_is_active_idx" ON "courses"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE INDEX "departments_course_id_idx" ON "departments"("course_id");

-- CreateIndex
CREATE INDEX "departments_is_active_idx" ON "departments"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "batches_code_key" ON "batches"("code");

-- CreateIndex
CREATE INDEX "batches_department_id_idx" ON "batches"("department_id");

-- CreateIndex
CREATE INDEX "batches_is_active_idx" ON "batches"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_organization_id_idx" ON "users"("organization_id");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "students_student_code_key" ON "students"("admission_no");

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

-- CreateIndex
CREATE INDEX "students_organization_id_idx" ON "students"("organization_id");

-- CreateIndex
CREATE INDEX "students_batch_id_idx" ON "students"("batch_id");

-- CreateIndex
CREATE INDEX "students_email_idx" ON "students"("email");

-- CreateIndex
CREATE INDEX "students_student_code_idx" ON "students"("admission_no");

-- CreateIndex
CREATE UNIQUE INDEX "parents_phone_key" ON "parents"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "parents_email_key" ON "parents"("email");

-- CreateIndex
CREATE INDEX "parents_phone_idx" ON "parents"("phone");

-- CreateIndex
CREATE INDEX "parents_email_idx" ON "parents"("email");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_device_id_idx" ON "user_sessions"("device_id");

-- CreateIndex
CREATE INDEX "user_sessions_is_active_idx" ON "user_sessions"("is_active");

-- CreateIndex
CREATE INDEX "user_sessions_expires_at_idx" ON "user_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_idx" ON "audit_logs"("organization_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_module_idx" ON "audit_logs"("module");

-- CreateIndex
CREATE INDEX "audit_logs_entity_id_idx" ON "audit_logs"("entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "student_parents_student_id_idx" ON "student_parents"("student_id");

-- CreateIndex
CREATE INDEX "student_parents_parent_id_idx" ON "student_parents"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_parents_student_id_parent_id_key" ON "student_parents"("student_id", "parent_id");

-- CreateIndex
CREATE INDEX "student_hostels_student_id_idx" ON "student_hostels"("student_id");

-- CreateIndex
CREATE INDEX "student_hostels_hostel_id_idx" ON "student_hostels"("hostel_id");

-- CreateIndex
CREATE INDEX "student_hostels_status_idx" ON "student_hostels"("status");

-- CreateIndex
CREATE INDEX "mentor_assignments_mentor_id_idx" ON "mentor_assignments"("mentor_id");

-- CreateIndex
CREATE INDEX "mentor_assignments_batch_id_idx" ON "mentor_assignments"("batch_id");

-- CreateIndex
CREATE INDEX "mentor_assignments_status_idx" ON "mentor_assignments"("status");

-- CreateIndex
CREATE INDEX "attendance_windows_hostel_id_idx" ON "attendance_windows"("hostel_id");

-- CreateIndex
CREATE INDEX "attendance_windows_attendance_date_idx" ON "attendance_windows"("attendance_date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_windows_hostel_id_attendance_date_key" ON "attendance_windows"("hostel_id", "attendance_date");

-- CreateIndex
CREATE INDEX "attendance_records_student_id_idx" ON "attendance_records"("student_id");

-- CreateIndex
CREATE INDEX "attendance_records_attendance_window_id_idx" ON "attendance_records"("attendance_window_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_attendance_window_id_student_id_key" ON "attendance_records"("attendance_window_id", "student_id");

-- CreateIndex
CREATE INDEX "attendance_corrections_attendance_record_id_idx" ON "attendance_corrections"("attendance_record_id");

-- CreateIndex
CREATE INDEX "passes_student_id_idx" ON "passes"("student_id");

-- CreateIndex
CREATE INDEX "passes_hostel_id_idx" ON "passes"("hostel_id");

-- CreateIndex
CREATE INDEX "passes_status_idx" ON "passes"("status");

-- CreateIndex
CREATE INDEX "pass_approvals_pass_id_idx" ON "pass_approvals"("pass_id");

-- CreateIndex
CREATE INDEX "pass_gate_logs_pass_id_idx" ON "pass_gate_logs"("pass_id");

-- CreateIndex
CREATE INDEX "pass_gate_logs_student_id_idx" ON "pass_gate_logs"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "complaint_categories_name_key" ON "complaint_categories"("name");

-- CreateIndex
CREATE INDEX "complaints_student_id_idx" ON "complaints"("student_id");

-- CreateIndex
CREATE INDEX "complaints_hostel_id_idx" ON "complaints"("hostel_id");

-- CreateIndex
CREATE INDEX "complaints_status_idx" ON "complaints"("status");

-- CreateIndex
CREATE INDEX "announcements_created_by_idx" ON "announcements"("created_by");

-- CreateIndex
CREATE INDEX "announcements_status_idx" ON "announcements"("status");

-- CreateIndex
CREATE INDEX "announcements_target_type_idx" ON "announcements"("target_type");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_organizations_announcement_id_organization_id_key" ON "announcement_organizations"("announcement_id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_hostels_announcement_id_hostel_id_key" ON "announcement_hostels"("announcement_id", "hostel_id");

-- CreateIndex
CREATE UNIQUE INDEX "visitors_phone_key" ON "visitors"("phone");

-- CreateIndex
CREATE INDEX "visitors_phone_idx" ON "visitors"("phone");

-- CreateIndex
CREATE INDEX "visitors_status_idx" ON "visitors"("status");

-- CreateIndex
CREATE INDEX "visitor_change_logs_visitor_id_idx" ON "visitor_change_logs"("visitor_id");

-- CreateIndex
CREATE INDEX "visit_requests_visitor_id_idx" ON "visit_requests"("visitor_id");

-- CreateIndex
CREATE INDEX "visit_requests_student_id_idx" ON "visit_requests"("student_id");

-- CreateIndex
CREATE INDEX "visit_requests_status_idx" ON "visit_requests"("status");

-- CreateIndex
CREATE INDEX "visitor_visits_visitor_ref_id_visitor_ref_type_idx" ON "visitor_visits"("visitor_ref_id", "visitor_ref_type");

-- CreateIndex
CREATE INDEX "visitor_visits_hostel_id_idx" ON "visitor_visits"("hostel_id");

-- CreateIndex
CREATE INDEX "visitor_visits_status_idx" ON "visitor_visits"("status");

-- CreateIndex
CREATE UNIQUE INDEX "visitor_visit_students_visitor_visit_id_student_id_key" ON "visitor_visit_students"("visitor_visit_id", "student_id");

-- CreateIndex
CREATE INDEX "furniture_types_hostel_id_idx" ON "furniture_types"("hostel_id");

-- CreateIndex
CREATE UNIQUE INDEX "furniture_assets_furniture_id_key" ON "furniture_assets"("furniture_id");

-- CreateIndex
CREATE INDEX "furniture_assets_furniture_type_id_idx" ON "furniture_assets"("furniture_type_id");

-- CreateIndex
CREATE INDEX "furniture_assets_student_id_idx" ON "furniture_assets"("student_id");

-- CreateIndex
CREATE INDEX "furniture_assets_status_idx" ON "furniture_assets"("status");

-- CreateIndex
CREATE INDEX "furniture_asset_histories_furniture_asset_id_idx" ON "furniture_asset_histories"("furniture_asset_id");

-- CreateIndex
CREATE INDEX "notifications_recipient_id_recipient_model_deleted_at_idx" ON "notifications"("recipient_id", "recipient_model", "deleted_at");

-- CreateIndex
CREATE INDEX "notifications_recipient_id_recipient_model_is_read_deleted__idx" ON "notifications"("recipient_id", "recipient_model", "is_read", "deleted_at");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "push_subscriptions_recipient_id_recipient_model_idx" ON "push_subscriptions"("recipient_id", "recipient_model");

-- CreateIndex
CREATE INDEX "otps_email_idx" ON "otps"("email");

-- CreateIndex
CREATE INDEX "password_requests_user_id_idx" ON "password_requests"("user_id");

-- CreateIndex
CREATE INDEX "activity_logs_entity_type_entity_id_idx" ON "activity_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "activity_logs_user_id_idx" ON "activity_logs"("user_id");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostels" ADD CONSTRAINT "hostels_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_organizations" ADD CONSTRAINT "hostel_organizations_hostel_id_fkey" FOREIGN KEY ("hostel_id") REFERENCES "hostels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_organizations" ADD CONSTRAINT "hostel_organizations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_wardens" ADD CONSTRAINT "hostel_wardens_hostel_id_fkey" FOREIGN KEY ("hostel_id") REFERENCES "hostels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_wardens" ADD CONSTRAINT "hostel_wardens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_parents" ADD CONSTRAINT "student_parents_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_parents" ADD CONSTRAINT "student_parents_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_hostels" ADD CONSTRAINT "student_hostels_allocated_by_fkey" FOREIGN KEY ("allocated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_hostels" ADD CONSTRAINT "student_hostels_hostel_id_fkey" FOREIGN KEY ("hostel_id") REFERENCES "hostels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_hostels" ADD CONSTRAINT "student_hostels_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_hostels" ADD CONSTRAINT "student_hostels_previous_allocation_id_fkey" FOREIGN KEY ("previous_allocation_id") REFERENCES "student_hostels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_hostels" ADD CONSTRAINT "student_hostels_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_hostels" ADD CONSTRAINT "student_hostels_vacated_by_fkey" FOREIGN KEY ("vacated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_assignments" ADD CONSTRAINT "mentor_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_assignments" ADD CONSTRAINT "mentor_assignments_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_assignments" ADD CONSTRAINT "mentor_assignments_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_assignments" ADD CONSTRAINT "mentor_assignments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_windows" ADD CONSTRAINT "attendance_windows_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_windows" ADD CONSTRAINT "attendance_windows_hostel_id_fkey" FOREIGN KEY ("hostel_id") REFERENCES "hostels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_windows" ADD CONSTRAINT "attendance_windows_started_by_fkey" FOREIGN KEY ("started_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_attendance_window_id_fkey" FOREIGN KEY ("attendance_window_id") REFERENCES "attendance_windows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_hostel_id_fkey" FOREIGN KEY ("hostel_id") REFERENCES "hostels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_scanned_by_fkey" FOREIGN KEY ("scanned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_attendance_record_id_fkey" FOREIGN KEY ("attendance_record_id") REFERENCES "attendance_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_corrected_by_fkey" FOREIGN KEY ("corrected_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passes" ADD CONSTRAINT "passes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passes" ADD CONSTRAINT "passes_hostel_id_fkey" FOREIGN KEY ("hostel_id") REFERENCES "hostels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passes" ADD CONSTRAINT "passes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passes" ADD CONSTRAINT "passes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passes" ADD CONSTRAINT "passes_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pass_approvals" ADD CONSTRAINT "pass_approvals_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pass_approvals" ADD CONSTRAINT "pass_approvals_pass_id_fkey" FOREIGN KEY ("pass_id") REFERENCES "passes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pass_gate_logs" ADD CONSTRAINT "pass_gate_logs_corrected_by_fkey" FOREIGN KEY ("corrected_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pass_gate_logs" ADD CONSTRAINT "pass_gate_logs_pass_id_fkey" FOREIGN KEY ("pass_id") REFERENCES "passes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pass_gate_logs" ADD CONSTRAINT "pass_gate_logs_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pass_gate_logs" ADD CONSTRAINT "pass_gate_logs_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_assigned_staff_fkey" FOREIGN KEY ("assigned_staff") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "complaint_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_hostel_id_fkey" FOREIGN KEY ("hostel_id") REFERENCES "hostels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_organizations" ADD CONSTRAINT "announcement_organizations_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_organizations" ADD CONSTRAINT "announcement_organizations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_hostels" ADD CONSTRAINT "announcement_hostels_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_hostels" ADD CONSTRAINT "announcement_hostels_hostel_id_fkey" FOREIGN KEY ("hostel_id") REFERENCES "hostels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "parents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_change_logs" ADD CONSTRAINT "visitor_change_logs_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "visitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_requests" ADD CONSTRAINT "visit_requests_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_requests" ADD CONSTRAINT "visit_requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_requests" ADD CONSTRAINT "visit_requests_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "visitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_visits" ADD CONSTRAINT "visitor_visits_checked_in_by_fkey" FOREIGN KEY ("checked_in_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_visits" ADD CONSTRAINT "visitor_visits_checked_out_by_fkey" FOREIGN KEY ("checked_out_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_visits" ADD CONSTRAINT "visitor_visits_hostel_id_fkey" FOREIGN KEY ("hostel_id") REFERENCES "hostels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_visit_students" ADD CONSTRAINT "visitor_visit_students_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_visit_students" ADD CONSTRAINT "visitor_visit_students_visitor_visit_id_fkey" FOREIGN KEY ("visitor_visit_id") REFERENCES "visitor_visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "furniture_types" ADD CONSTRAINT "furniture_types_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "furniture_types" ADD CONSTRAINT "furniture_types_hostel_id_fkey" FOREIGN KEY ("hostel_id") REFERENCES "hostels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "furniture_types" ADD CONSTRAINT "furniture_types_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "furniture_types" ADD CONSTRAINT "furniture_types_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "furniture_assets" ADD CONSTRAINT "furniture_assets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "furniture_assets" ADD CONSTRAINT "furniture_assets_furniture_type_id_fkey" FOREIGN KEY ("furniture_type_id") REFERENCES "furniture_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "furniture_assets" ADD CONSTRAINT "furniture_assets_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "furniture_assets" ADD CONSTRAINT "furniture_assets_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "furniture_asset_histories" ADD CONSTRAINT "furniture_asset_histories_furniture_asset_id_fkey" FOREIGN KEY ("furniture_asset_id") REFERENCES "furniture_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "furniture_asset_histories" ADD CONSTRAINT "furniture_asset_histories_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "furniture_asset_histories" ADD CONSTRAINT "furniture_asset_histories_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_requests" ADD CONSTRAINT "password_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
