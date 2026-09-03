import { prisma } from './src/config/prisma.js';
const run = async () => {
  const courses = await prisma.course.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
  console.log('Last 5 courses:', courses);
};
run().catch(console.error);
