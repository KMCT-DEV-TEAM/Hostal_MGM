import { prisma } from './src/config/prisma.js';
const run = async () => {
  const courses = await prisma.course.findMany({
    include: {
      _count: {
        select: { departments: true }
      },
      departments: {
        include: {
          _count: {
            select: { batches: true }
          }
        }
      }
    }
  });

  for (const c of courses) {
    const actualBatches = c.departments.reduce((sum, d) => sum + d._count.batches, 0);
    const actualDepts = c._count.departments;
    
    if (c.batchesCount !== actualBatches || c.departmentsCount !== actualDepts) {
      console.log(`Course ${c.name} has discrepancy!`);
      console.log(`DB batchesCount: ${c.batchesCount}, Actual: ${actualBatches}`);
      console.log(`DB departmentsCount: ${c.departmentsCount}, Actual: ${actualDepts}`);
      
      // Fix it!
      await prisma.course.update({
        where: { id: c.id },
        data: {
          batchesCount: actualBatches,
          departmentsCount: actualDepts
        }
      });
      console.log('Fixed!');
    }
  }
};
run();
