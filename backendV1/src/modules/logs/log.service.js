import { prisma } from '../../config/prisma.js';

export const createLogDb = async (data) => {
    console.log("Stub: createLogDb called with data:", data);
    try {
        await prisma.activityLog.create({
            data: {
                action: data.action,
                entityType: data.entityType,
                entityId: data.entityId,
                userId: data.user,
                userRole: data.userRole || "unknown",
                details: data.details,
                status: data.status === "success" ? "SUCCESS" : (data.status === "error" ? "ERROR" : "WARNING")
            }
        });
    } catch (err) {
        console.error("Failed to create log:", err.message);
    }
};

export const getLogsService = async (queryParams) => {
    const { page = 1, limit = 10, search = '', status, startDate, endDate } = queryParams;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (search) {
        where.OR = [
            { action: { contains: search, mode: 'insensitive' } },
            { details: { contains: search, mode: 'insensitive' } },
        ];
    }

    if (status && status !== 'all') {
        if (status === 'success') where.status = 'SUCCESS';
        else if (status === 'error') where.status = 'ERROR';
        else if (status === 'warning') where.status = 'WARNING';
    }

    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
            where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            where.createdAt.lte = end;
        }
    }

    const queryOptions = {
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            user: { select: { id: true, name: true, email: true } }
        }
    };

    if (limitNum > 0) {
        queryOptions.skip = skip;
        queryOptions.take = limitNum;
    }

    const [logs, totalCount] = await Promise.all([
        prisma.activityLog.findMany(queryOptions),
        prisma.activityLog.count({ where })
    ]);

    const totalPages = limitNum > 0 ? Math.ceil(totalCount / limitNum) : 1;

    // Convert keys to match what frontend expects, if needed
    const mappedLogs = logs.map(log => ({
        ...log,
        status: log.status.toLowerCase()
    }));

    return {
        logs: mappedLogs,
        totalCount,
        totalPages,
        currentPage: pageNum
    };
};
