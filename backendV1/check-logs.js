import { prisma } from './src/config/prisma.js';

const run = async () => {
  const logs = await prisma.activityLog.findMany();
  console.log('Total Logs:', logs.length);
  console.log('Last 5:', logs.slice(-5));
};

run().catch(console.error);
