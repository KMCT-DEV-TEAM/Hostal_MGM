import { prisma } from './src/config/prisma.js';

async function fixCodes() {
  console.log("Starting to fix duplicate prefixes in codes...");

  // 1. Fix Departments
  const departments = await prisma.department.findMany({ include: { course: true } });
  for (const dept of departments) {
    if (dept.course && dept.course.code) {
      let suffix = dept.code;
      const prefix = `${dept.course.code}-`;
      while (suffix.startsWith(prefix) && suffix.substring(prefix.length).startsWith(prefix)) {
        // Strip duplicate prefix
        suffix = suffix.substring(prefix.length);
      }
      // suffix now should only have ONE prefix max (or if we stripped them all, we can just add one)
      // Actually if it's supposed to have ONE prefix:
      // Strip ALL prefixes:
      while (suffix.startsWith(prefix)) {
        suffix = suffix.substring(prefix.length);
      }
      
      const correctCode = `${prefix}${suffix}`;
      if (correctCode !== dept.code) {
        // Only update if it doesn't exceed length limit
        if (correctCode.length <= 50) {
            await prisma.department.update({
            where: { id: dept.id },
            data: { code: correctCode }
            });
            console.log(`Updated department ${dept.name} code from ${dept.code} to ${correctCode}`);
        } else {
            console.log(`Warning: Corrected code for ${dept.name} is still too long: ${correctCode}`);
        }
      }
    }
  }

  // 2. Fix Courses
  const courses = await prisma.course.findMany({ include: { organization: true } });
  for (const course of courses) {
    if (course.organization && course.organization.code) {
      let suffix = course.code;
      const prefix = `${course.organization.code}-`;
      while (suffix.startsWith(prefix)) {
        suffix = suffix.substring(prefix.length);
      }
      const correctCode = `${prefix}${suffix}`;
      if (correctCode !== course.code) {
        if (correctCode.length <= 50) {
            await prisma.course.update({
            where: { id: course.id },
            data: { code: correctCode }
            });
            console.log(`Updated course ${course.name} code from ${course.code} to ${correctCode}`);
        }
      }
    }
  }

  // 3. Fix Batches
  const batches = await prisma.batch.findMany({ include: { department: true } });
  for (const batch of batches) {
    if (batch.department && batch.department.code) {
      let suffix = batch.code;
      const prefix = `${batch.department.code}-`;
      while (suffix.startsWith(prefix)) {
        suffix = suffix.substring(prefix.length);
      }
      const correctCode = `${prefix}${suffix}`;
      if (correctCode !== batch.code) {
        if (correctCode.length <= 50) {
            await prisma.batch.update({
            where: { id: batch.id },
            data: { code: correctCode }
            });
            console.log(`Updated batch ${batch.name} code from ${batch.code} to ${correctCode}`);
        }
      }
    }
  }

  console.log("Finished fixing codes!");
  await prisma.$disconnect();
}

fixCodes().catch(e => {
  console.error(e);
  process.exit(1);
});
