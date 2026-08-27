import { PrismaClient, Role, HostelType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding Hostel Management System Master Data...');
  const defaultPassword = await bcrypt.hash('password123', 10);
  const superAdmin = await prisma.user.findFirst({
    where: { role: 'super_admin' }
  });
  if (!superAdmin) {
    throw new Error("Super Admin user not found. Please run 'npm run seedSuperAdmin' first!");
  }
  const superAdminId = superAdmin.id;

  // ==========================================
  // 1. CORE HIERARCHY
  // OrganizationA -> CourseA -> DepartmentA -> BatchA
  // ==========================================

  const org = await prisma.organization.upsert({
    where: { code: 'ORG-A' },
    update: {},
    create: {
      name: 'OrganizationA',
      code: 'ORG-A',
      organisationNumber: 'NUM-ORG-A',
      email: 'adminA@organizationa.com',
      adminId: superAdminId,
    },
  });

  const course = await prisma.course.upsert({
    where: { code: 'COURSE-A' },
    update: {},
    create: {
      name: 'CourseA',
      code: 'COURSE-A',
      organizationId: org.id,
    },
  });

  const department = await prisma.department.upsert({
    where: { code: 'DEPT-A' },
    update: {},
    create: {
      name: 'DepartmentA',
      code: 'DEPT-A',
      courseId: course.id,
    },
  });

  const batch = await prisma.batch.upsert({
    where: { code: 'BATCH-A' },
    update: {},
    create: {
      name: 'BatchA',
      code: 'BATCH-A',
      departmentId: department.id,
      startYear: 2024,
      endYear: 2028,
    },
  });

  console.log('✅ Core Hierarchy Created (Org -> Course -> Dept -> Batch)');

  // ==========================================
  // 2. STUDENTS
  // OrganizationA -> Students A, B, C
  // ==========================================

  const studentA = await prisma.student.upsert({
    where: { email: 'studentA@organizationa.com' },
    update: {},
    create: {
      name: 'StudentA',
      email: 'studentA@organizationa.com',
      password: defaultPassword,
      admissionNo: 'ADM-A-001',
      organizationId: org.id,
      courseId: course.id,
      departmentId: department.id,
      batchId: batch.id,
      phone: '1234567890',
    },
  });

  const studentB = await prisma.student.upsert({
    where: { email: 'studentB@organizationa.com' },
    update: {},
    create: {
      name: 'StudentB',
      email: 'studentB@organizationa.com',
      password: defaultPassword,
      admissionNo: 'ADM-A-002',
      organizationId: org.id,
      courseId: course.id,
      departmentId: department.id,
      batchId: batch.id,
      phone: '1234567891',
    },
  });

  const studentC = await prisma.student.upsert({
    where: { email: 'studentC@organizationa.com' },
    update: {},
    create: {
      name: 'StudentC',
      email: 'studentC@organizationa.com',
      password: defaultPassword,
      admissionNo: 'ADM-A-003',
      organizationId: org.id,
      courseId: course.id,
      departmentId: department.id,
      batchId: batch.id,
      phone: '1234567892',
    },
  });

  console.log(`✅ Students Created: ${studentA.name}, ${studentB.name}, ${studentC.name}`);

  // ==========================================
  // 3. STAFF & PARENT ACCOUNTS
  // OrganizationA -> AdminA, WardenA, MentorA, ParentA
  // ==========================================

  const adminA = await prisma.user.upsert({
    where: { email: 'adminA@organizationa.com' },
    update: {},
    create: {
      name: 'AdminA',
      email: 'adminA@organizationa.com',
      password: defaultPassword,
      role: Role.admin,
      organizationId: org.id,
      createdBy: superAdminId,
    },
  });

  const wardenA = await prisma.user.upsert({
    where: { email: 'wardenA@organizationa.com' },
    update: {},
    create: {
      name: 'WardenA',
      email: 'wardenA@organizationa.com',
      password: defaultPassword,
      role: Role.warden,
      organizationId: org.id,
      createdBy: superAdminId,
    },
  });

  const mentorA = await prisma.user.upsert({
    where: { email: 'mentorA@organizationa.com' },
    update: {},
    create: {
      name: 'MentorA',
      email: 'mentorA@organizationa.com',
      password: defaultPassword,
      role: Role.mentor,
      organizationId: org.id,
      createdBy: superAdminId,
    },
  });

  const parentA = await prisma.parent.upsert({
    where: { email: 'parentA@organizationa.com' },
    update: {},
    create: {
      parentName: 'ParentA',
      email: 'parentA@organizationa.com',
      password: defaultPassword,
      phone: '98765433s10',
    },
  });

  const parentB = await prisma.parent.upsert({
    where: { email: 'parentB@organizationa.com' },
    update: {},
    create: {
      parentName: 'ParentB',
      email: 'parentB@organizationa.com',
      password: defaultPassword,
      phone: '9876543210',
    },
  });

  const parentC = await prisma.parent.upsert({
    where: { email: 'parentC@organizationa.com' },
    update: {},
    create: {
      parentName: 'ParentC',
      email: 'parentC@organizationa.com',
      password: defaultPassword,
      phone: '9876543220',
    },
  });

  console.log(`✅ Accounts Created: ${adminA.name}, ${wardenA.name}, ${mentorA.name}, ${parentA.parentName}, ${parentB.parentName}, ${parentC.parentName}`);

  // ==========================================
  // 4. INFRASTRUCTURE
  // OrganizationA -> HostelA
  // Note: Rooms are handled dynamically via allocations in this schema.
  // RoomA, RoomB, RoomC will be assigned when creating StudentHostel allocations.
  // ==========================================

  const hostelA = await prisma.hostel.upsert({
    where: { code: 'HOSTEL-A' },
    update: {},
    create: {
      name: 'HostelA',
      code: 'HOSTEL-A',
      hostelType: HostelType.BOYS,
      capacity: 100,
      adminId: superAdminId,
      organizations: {
        create: [{ organizationId: org.id }],
      },
    },
  });

  console.log(`✅ Infrastructure Created: ${hostelA.name} (Rooms handled dynamically during allocations)`);

  // ==========================================
  // 5. PARENT-STUDENT RELATION
  // Linking ParentA to StudentA
  // ==========================================

  const studentParentA = await prisma.studentParent.upsert({
    where: {
      studentId_parentId: {
        studentId: studentA.id,
        parentId: parentA.id,
      },
    },
    update: {},
    create: {
      studentId: studentA.id,
      parentId: parentA.id,
      defaultGuardian: true,
    },
  });
  const studentParentB = await prisma.studentParent.upsert({
    where: {
      studentId_parentId: {
        studentId: studentB.id,
        parentId: parentB.id,
      },
    },
    update: {},
    create: {
      studentId: studentB.id,
      parentId: parentB.id,
      defaultGuardian: true,
    },
  });
  const studentParentC = await prisma.studentParent.upsert({
    where: {
      studentId_parentId: {
        studentId: studentC.id,
        parentId: parentC.id,
      },
    },
    update: {},
    create: {
      studentId: studentC.id,
      parentId: parentC.id,
      defaultGuardian: true,
    },
  });

  console.log(`✅ Student-Parent Relation Created: ParentA -> StudentA`);

  console.log('\n🎉 Seeding Complete! All data is strictly mapped and safely upserted.');
}


main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
