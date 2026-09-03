import { createLogDb } from './src/modules/logs/log.service.js';
import { prisma } from './src/config/prisma.js';

const run = async () => {
  const user = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (!user) return console.log('no admin user');
  
  await createLogDb({
    action: "Test Log",
    entityType: "Course",
    entityId: "123",
    user: user.id,
    userRole: user.role,
    details: "Test detail",
    status: "success"
  });
  console.log("Log created?");
};
run();
