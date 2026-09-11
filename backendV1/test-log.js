import { prisma } from './src/config/prisma.js';

const run = async () => {
  const user = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (!user) return console.log('no admin user');
  
  await createLog(user, "Test Log", "Course", "123", "Test detail", "success");
  console.log("Log created?");
};
run();
