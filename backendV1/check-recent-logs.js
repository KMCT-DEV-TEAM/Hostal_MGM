import { prisma } from './src/config/prisma.js';

const run = async () => {
    const logs = await prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: true }
    });
    console.log("Recent logs:", logs.map(l => ({
        action: l.action,
        user: l.user?.email,
        createdAt: l.createdAt
    })));
};
run();
