import { prisma } from './src/config/prisma.js';

async function fixCounters() {
  console.log("Starting to fix counters...");

  // 1. Fix department batches count
  const departments = await prisma.department.findMany({
    include: { _count: { select: { batches: true } } }
  });
  
  for (const dept of departments) {
    if (dept.batchesCount !== dept._count.batches) {
      await prisma.department.update({
        where: { id: dept.id },
        data: { batchesCount: dept._count.batches }
      });
      console.log(`Updated department ${dept.code} batchesCount to ${dept._count.batches}`);
    }
  }

  // 2. Fix course departments count and batches count
  const courses = await prisma.course.findMany({
    include: { 
      _count: { select: { departments: true } }, 
      departments: { select: { batchesCount: true } } 
    }
  });

  for (const course of courses) {
    const totalBatches = course.departments.reduce((sum, d) => sum + d.batchesCount, 0);
    if (course.departmentsCount !== course._count.departments || course.batchesCount !== totalBatches) {
      await prisma.course.update({
        where: { id: course.id },
        data: { 
          departmentsCount: course._count.departments,
          batchesCount: totalBatches
        }
      });
      console.log(`Updated course ${course.code} departmentsCount to ${course._count.departments}, batchesCount to ${totalBatches}`);
    }
  }

  console.log("Finished fixing counters!");
  await prisma.$disconnect();
}

fixCounters().catch(e => {
  console.error(e);
  process.exit(1);
});
