import { prisma } from '../../config/prisma.js';
import { VISITOR_STATUS, VISIT_REQUEST_STATUS, VISIT_STATUS } from './visitor.constant.js';

/**
 * Get hostel IDs assigned to a warden
 */
export const findWardenHostelIds = async (wardenId, tx = prisma) => {
    const wardenHostels = await tx.hostel.findMany({
        where: { wardens: { some: { id: wardenId } } },
        select: { id: true }
    });
    return wardenHostels.map(h => h.id);
};

/**
 * Get active batch IDs assigned to a mentor
 */
export const findMentorBatchIds = async (mentorId, tx = prisma) => {
    const activeAssignments = await tx.mentorAssignment.findMany({
        where: { mentorId, status: 'active' },
        select: { batchId: true }
    });
    return activeAssignments.map(a => a.batchId);
};

/**
 * Get active student IDs linked to a parent
 */
export const findParentStudentIds = async (parentId, tx = prisma) => {
    const links = await tx.studentParent.findMany({
        where: { parentId, status: 'active' },
        select: { studentId: true }
    });
    return links.map(l => l.studentId);
};

/**
 * Count visitors matching filter condition
 */
export const countVisitors = async (where, tx = prisma) => {
    return await tx.visitor.count({ where });
};

/**
 * Find paginated list of visitors matching filter condition
 */
export const findVisitors = async (where, { skip = 0, limit = 10, orderBy = { createdAt: 'desc' } }, tx = prisma) => {
    return await tx.visitor.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
            visitRequests: {
                where: { status: { in: [VISIT_REQUEST_STATUS.PENDING, VISIT_REQUEST_STATUS.APPROVED] } },
                include: {
                    student: {
                        select: {
                            id: true,
                            name: true,
                            studentHostels: {
                                where: { status: 'active' },
                                select: { roomNumber: true }
                            }
                        }
                    }
                }
            }
        }
    });
};

/**
 * Execute count and findMany for paginated listing.
 * Note: Promise.all runs concurrently with standard Prisma client (tx = prisma).
 * Inside interactive transactions ($transaction(async (tx) => ...)), operations run sequentially on a single connection.
 */
export const findVisitorsPaginated = async (where, { skip = 0, limit = 10, orderBy = { createdAt: 'desc' } }, tx = prisma) => {
    const [total, data] = await Promise.all([
        countVisitors(where, tx),
        findVisitors(where, { skip, limit, orderBy }, tx)
    ]);
    return { total, data };
};

/**
 * Super Admin Dashboard Counts
 */
export const getSuperAdminDashboardCounts = async ({ today, endOfToday }, tx = prisma) => {
    const [total, pending, inside, todaysVisits] = await Promise.all([
        tx.visitor.count({ where: { status: { not: VISITOR_STATUS.DELETED } } }),
        tx.visitRequest.count({ where: { status: VISIT_REQUEST_STATUS.PENDING } }),
        tx.visitorVisit.count({
            where: { status: { in: [VISIT_STATUS.CHECKED_IN, VISIT_STATUS.EXTENDED, VISIT_STATUS.OVERSTAYED] } }
        }),
        tx.visitorVisit.count({
            where: { checkInTime: { gte: today, lte: endOfToday } }
        })
    ]);
    return { total, pending, inside, todaysVisits };
};

/**
 * Admin Dashboard Counts
 */
export const getAdminDashboardCounts = async (organizationId, { today, endOfToday }, tx = prisma) => {
    const orgFilter = organizationId ? { student: { organizationId } } : {};
    const visitStudentsFilter = organizationId ? { visitStudents: { some: { student: { organizationId } } } } : {};

    const [pending, approved, inside, todaysVisits] = await Promise.all([
        tx.visitRequest.count({ where: { status: VISIT_REQUEST_STATUS.PENDING, ...orgFilter } }),
        tx.visitRequest.count({ where: { status: VISIT_REQUEST_STATUS.APPROVED, ...orgFilter } }),
        tx.visitorVisit.count({
            where: {
                status: { in: [VISIT_STATUS.CHECKED_IN, VISIT_STATUS.EXTENDED, VISIT_STATUS.OVERSTAYED] },
                ...visitStudentsFilter
            }
        }),
        tx.visitorVisit.count({
            where: {
                checkInTime: { gte: today, lte: endOfToday },
                ...visitStudentsFilter
            }
        })
    ]);
    return { pending, approved, inside, todaysVisits };
};

/**
 * Warden Dashboard Counts
 */
export const getWardenDashboardCounts = async (hostelIds, { today, endOfToday, now }, tx = prisma) => {
    const [inside, todaysCheckIns, todaysCheckOuts, overstayed] = await Promise.all([
        tx.visitorVisit.count({
            where: { status: { in: [VISIT_STATUS.CHECKED_IN, VISIT_STATUS.EXTENDED, VISIT_STATUS.OVERSTAYED] }, hostelId: { in: hostelIds } }
        }),
        tx.visitorVisit.count({
            where: { checkInTime: { gte: today, lte: endOfToday }, hostelId: { in: hostelIds } }
        }),
        tx.visitorVisit.count({
            where: { checkOutTime: { gte: today, lte: endOfToday }, hostelId: { in: hostelIds } }
        }),
        tx.visitorVisit.count({
            where: {
                status: { in: [VISIT_STATUS.CHECKED_IN, VISIT_STATUS.EXTENDED, VISIT_STATUS.OVERSTAYED] },
                expectedExitTime: { lt: now },
                hostelId: { in: hostelIds }
            }
        })
    ]);
    return { inside, todaysCheckIns, todaysCheckOuts, overstayed };
};

/**
 * Parent Dashboard Counts
 */
export const getParentDashboardCounts = async (parentId, studentIds, tx = prisma) => {
    const [myVisitors, pending, approved, rejected] = await Promise.all([
        tx.visitor.count({
            where: { visitRequests: { some: { studentId: { in: studentIds }, parentId } } }
        }),
        tx.visitRequest.count({
            where: { parentId, studentId: { in: studentIds }, status: VISIT_REQUEST_STATUS.PENDING }
        }),
        tx.visitRequest.count({
            where: { parentId, studentId: { in: studentIds }, status: VISIT_REQUEST_STATUS.APPROVED }
        }),
        tx.visitRequest.count({
            where: { parentId, studentId: { in: studentIds }, status: VISIT_REQUEST_STATUS.REJECTED }
        })
    ]);
    return { myVisitors, pending, approved, rejected };
};

/**
 * Student Dashboard Counts
 */
export const getStudentDashboardCounts = async (studentId, { today, endOfToday }, tx = prisma) => {
    const [approved, pending, todaysVisits, total] = await Promise.all([
        tx.visitRequest.count({
            where: { studentId, status: VISIT_REQUEST_STATUS.APPROVED }
        }),
        tx.visitRequest.count({
            where: { studentId, status: VISIT_REQUEST_STATUS.PENDING }
        }),
        tx.visitorVisit.count({
            where: {
                checkInTime: { gte: today, lte: endOfToday },
                visitStudents: { some: { studentId } }
            }
        }),
        tx.visitor.count({
            where: { visitRequests: { some: { studentId } } }
        })
    ]);
    return { approved, pending, todaysVisits, total };
};

/**
 * Count visitor visits matching filter condition
 */
export const countVisitorVisits = async (where, tx = prisma) => {
    return await tx.visitorVisit.count({ where });
};

/**
 * Find paginated list of visitor visits matching filter condition
 */
export const findVisitorVisits = async (where, { skip = 0, limit = 10, orderBy = { checkInTime: 'desc' } }, tx = prisma) => {
    return await tx.visitorVisit.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
            hostel: { select: { id: true, name: true } },
            visitStudents: {
                include: {
                    student: {
                        select: { id: true, name: true, studentHostels: { where: { status: 'active' }, select: { roomNumber: true } } }
                    }
                }
            }
        }
    });
};

/**
 * Execute count and findMany for paginated visitor visits
 */
export const findVisitorVisitsPaginated = async (where, { skip = 0, limit = 10, orderBy = { checkInTime: 'desc' } }, tx = prisma) => {
    const [total, rawVisits] = await Promise.all([
        countVisitorVisits(where, tx),
        findVisitorVisits(where, { skip, limit, orderBy }, tx)
    ]);
    return { total, rawVisits };
};

/**
 * Find visitor profiles by array of IDs (used for batch resolving visitor names and phones)
 */
export const findVisitorProfilesByIds = async (visitorIds, tx = prisma) => {
    if (!visitorIds || visitorIds.length === 0) return [];
    return await tx.visitor.findMany({
        where: { id: { in: visitorIds } },
        select: { id: true, name: true, phone: true }
    });
};

/**
 * Super Admin: Group visitor visits by hostel and status
 */
export const getSuperAdminHostelVisitStats = async (tx = prisma) => {
    return await tx.visitorVisit.groupBy({
        by: ['hostelId', 'status'],
        _count: { id: true }
    });
};

/**
 * Find hostels with assigned warden user names
 */
export const findHostelsWithWardens = async (hostelIds, search = null, tx = prisma) => {
    if (!hostelIds || hostelIds.length === 0) return [];
    return await tx.hostel.findMany({
        where: {
            id: { in: hostelIds },
            ...(search ? { name: { contains: search, mode: 'insensitive' } } : {})
        },
        select: {
            id: true,
            name: true,
            wardens: {
                select: {
                    user: {
                        select: { name: true }
                    }
                }
            }
        },
        orderBy: { name: 'asc' }
    });
};

/**
 * Find hostels for Super Admin hostel visitor summary
 */
export const findAllHostelsForSummary = async (search = null, tx = prisma) => {
    return await tx.hostel.findMany({
        where: search ? { name: { contains: search, mode: 'insensitive' } } : {},
        select: {
            id: true,
            name: true,
            code: true
        },
        orderBy: { name: 'asc' }
    });
};

/**
 * Find visit requests with active student hostels for Super Admin hostel visitor summary
 */
export const findAllVisitRequestsForHostelSummary = async (tx = prisma) => {
    return await tx.visitRequest.findMany({
        select: {
            visitorId: true,
            status: true,
            student: {
                select: {
                    studentHostels: {
                        where: { status: 'active' },
                        select: { hostelId: true }
                    }
                }
            }
        }
    });
};

/**
 * Find visitor details by ID including pending/approved visit requests and active student hostels
 */
export const findVisitorDetailsById = async (visitorId, tx = prisma) => {
    return await tx.visitor.findUnique({
        where: { id: visitorId },
        include: {
            visitRequests: {
                where: { status: { in: [VISIT_REQUEST_STATUS.PENDING, VISIT_REQUEST_STATUS.APPROVED] } },
                include: {
                    student: {
                        select: {
                            id: true,
                            name: true,
                            studentHostels: {
                                where: { status: 'active' },
                                select: { roomNumber: true, hostel: { select: { name: true } } }
                            },
                            batchId: true,
                            organizationId: true
                        }
                    }
                }
            }
        }
    });
};

/**
 * Find active student parent link for authorization check
 */
export const findParentStudentLink = async (parentId, studentId, tx = prisma) => {
    return await tx.studentParent.findFirst({
        where: { parentId, studentId, status: 'active' }
    });
};

/**
 * Find parent by ID
 */
export const findParentById = async (parentId, tx = prisma) => {
    return await tx.parent.findUnique({ where: { id: parentId } });
};

/**
 * Find students with active hostel assignments
 */
export const findStudentsWithHostels = async (studentIds, tx = prisma) => {
    return await tx.student.findMany({
        where: { id: { in: studentIds } },
        include: {
            studentHostels: {
                where: { status: 'active' },
                select: { hostelId: true }
            }
        }
    });
};

/**
 * Find existing visitor profile by ID proof or phone number
 */
export const findExistingVisitorByIdProofOrPhone = async ({ idProofType, idProofNumber, phone }, tx = prisma) => {
    let existingVisitor = null;
    if (idProofType && idProofNumber) {
        existingVisitor = await tx.visitor.findFirst({ where: { idProofType, idProofNumber } });
    }
    if (!existingVisitor && phone) {
        existingVisitor = await tx.visitor.findUnique({ where: { phone } });
    }
    return existingVisitor;
};

/**
 * Find pending or approved visit requests for a visitor profile
 */
export const findVisitorPendingOrApprovedRequests = async (visitorId, tx = prisma) => {
    return await tx.visitRequest.findMany({
        where: {
            visitorId,
            status: { in: [VISIT_REQUEST_STATUS.PENDING, VISIT_REQUEST_STATUS.APPROVED] }
        },
        include: {
            student: {
                select: {
                    id: true,
                    name: true,
                    studentHostels: { where: { status: 'active' }, select: { roomNumber: true } }
                }
            }
        }
    });
};

/**
 * Find visitor profile by ID
 */
export const findVisitorById = async (visitorId, tx = prisma) => {
    return await tx.visitor.findUnique({ where: { id: visitorId } });
};

/**
 * Find blocking visit requests for a visitor and set of student IDs
 */
export const findBlockingVisitRequests = async (visitorId, studentIds, tx = prisma) => {
    return await tx.visitRequest.findMany({
        where: {
            visitorId,
            studentId: { in: studentIds },
            status: { in: [VISIT_REQUEST_STATUS.PENDING, VISIT_REQUEST_STATUS.APPROVED] }
        }
    });
};

/**
 * Find active visits currently in progress for a visitor and student IDs
 */
export const findActiveVisitsForVisitor = async (visitorId, studentIds, tx = prisma) => {
    return await tx.visitorVisit.findMany({
        where: {
            visitorRefId: visitorId,
            visitorRefType: 'Visitor',
            status: { in: [VISIT_STATUS.CHECKED_IN, VISIT_STATUS.EXTENDED, VISIT_STATUS.OVERSTAYED] },
            visitStudents: { some: { studentId: { in: studentIds } } }
        }
    });
};

/**
 * Find students with active hostels and assigned warden user IDs
 */
export const findStudentsWithHostelWardens = async (studentIds, tx = prisma) => {
    return await tx.student.findMany({
        where: { id: { in: studentIds } },
        include: {
            studentHostels: {
                where: { status: 'active' },
                include: { hostel: { include: { wardens: { select: { userId: true } } } } }
            }
        }
    });
};

/**
 * Find approved visit requests for visitor check-in validation
 */
export const findApprovedRequestsForVisitor = async (visitorId, studentIds, tx = prisma) => {
    return await tx.visitRequest.findMany({
        where: {
            visitorId,
            studentId: { in: studentIds },
            status: VISIT_REQUEST_STATUS.APPROVED
        }
    });
};

/**
 * Find existing active check-in visit for a visitor
 */
export const findActiveCheckInVisit = async (visitorRefId, visitorRefType, tx = prisma) => {
    return await tx.visitorVisit.findFirst({
        where: {
            visitorRefId,
            visitorRefType,
            status: VISIT_STATUS.CHECKED_IN
        }
    });
};

/**
 * Find visit request with student and visitor details for authorization check
 */
export const findVisitRequestForAuthorization = async (visitRequestId, tx = prisma) => {
    return await tx.visitRequest.findUnique({
        where: { id: visitRequestId },
        include: {
            student: {
                select: {
                    id: true,
                    name: true,
                    organizationId: true,
                    batchId: true,
                    studentHostels: { where: { status: 'active' }, select: { hostelId: true, hostel: { select: { wardens: { select: { userId: true } } } } } }
                }
            },
            visitor: {
                select: { id: true, name: true }
            }
        }
    });
};

/**
 * Find visit with hostel wardens and existing visit student IDs for adding students
 */
export const findVisitForStudentAddition = async (visitId, tx = prisma) => {
    return await tx.visitorVisit.findUnique({
        where: { id: visitId },
        include: {
            hostel: { select: { id: true, name: true, wardens: { select: { userId: true } } } },
            visitStudents: { select: { studentId: true } }
        }
    });
};

/**
 * Find visitor profile with associated visit request student IDs
 */
export const findVisitorWithStudentIds = async (visitorId, tx = prisma) => {
    return await tx.visitor.findUnique({
        where: { id: visitorId },
        include: { visitRequests: { select: { studentId: true } } }
    });
};

/**
 * Find student IDs by batch IDs (used for mentor authorization checks)
 */
export const findStudentIdsByBatchIds = async (batchIds, tx = prisma) => {
    if (!batchIds || batchIds.length === 0) return [];
    const students = await tx.student.findMany({
        where: { batchId: { in: batchIds } },
        select: { id: true }
    });
    return students.map(s => s.id);
};

/**
 * Find visit request linking visitor to target student IDs
 */
export const findVisitRequestByVisitorAndStudents = async (visitorId, studentIds, tx = prisma) => {
    return await tx.visitRequest.findFirst({
        where: {
            visitorId,
            studentId: { in: studentIds }
        }
    });
};
