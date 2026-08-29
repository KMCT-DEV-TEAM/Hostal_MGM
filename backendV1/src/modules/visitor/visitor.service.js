import { prisma } from '../../config/prisma.js';
import { orchestratorService } from '../notifications/services/orchestrator.service.js';
import {
    VISITOR_STATUS,
    VISIT_REQUEST_STATUS,
    VISITOR_CHANGE_LOG_ACTIONS,
    VISIT_STATUS
} from './visitor.constant.js';

const mapStudentRoomNumber = (visitor) => {
    if (visitor.visitRequests) {
        visitor.visitRequests = visitor.visitRequests.map(vr => {
            if (vr.student) {
                vr.student.roomNumber = vr.student.studentHostels?.[0]?.roomNumber || null;
                if (vr.student.studentHostels?.[0]?.hostel) {
                    vr.student.hostel = vr.student.studentHostels[0].hostel;
                }
                delete vr.student.studentHostels;
            }
            return vr;
        });
    }
    return visitor;
};

const createError = (message, status = 400) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

// ============================================================================
// Core Validation Helpers
// ============================================================================

export const validateParentAndStudents = async (parentId, studentIds) => {
    // 1. Verify Parent
    const currentParent = await prisma.parent.findUnique({ where: { id: parentId } });
    console.log("------Parent--------", currentParent)
    if (!currentParent) throw createError("We couldn't find your parent profile. Please try logging in again.", 404);
    if (!currentParent.isActive || !currentParent.isVerified) {
        throw createError("Your account is currently inactive or not verified. Please contact the hostel administration for assistance.", 403);
    }

    // 2. Validate Students
    const studentParentLinks = await prisma.studentParent.findMany({
        where: { parentId, status: 'active' }
    });
    const authorizedStudentIds = studentParentLinks.map(link => link.studentId);

    for (const sId of studentIds) {
        if (!authorizedStudentIds.includes(sId)) {
            throw createError("You do not have permission to schedule visits for one of the selected students.", 403);
        }
    }

    const students = await prisma.student.findMany({
        where: { id: { in: studentIds } },
        include: {
            studentHostels: {
                where: { status: 'active' },
                select: { hostelId: true }
            }
        }
    });
    if (students.length !== studentIds.length) {
        throw createError("We couldn't find some of the selected students. Please refresh the page and try again.", 404);
    }

    for (const student of students) {
        if (!student.isActive) throw createError(`The student '${student.name}' is currently inactive, so you cannot schedule a visit for them.`, 400);
        if (!student.studentHostels || student.studentHostels.length === 0 || !student.studentHostels[0].hostelId) {
            throw createError(`The student '${student.name}' is not currently assigned to a hostel, so you cannot schedule a visit.`, 400);
        }
    }

    return { parent: currentParent, students };
};

// ============================================================================
// Visitor Creation & Confirmation
// ============================================================================

export const createBrandNewVisitorProfile = async (payload, user) => {
    const { studentIds, name, relationship, phone, email, address, idProofType, idProofNumber, purpose, remarks } = payload;
    const { students } = await validateParentAndStudents(user.id, studentIds);

    let existingVisitor = null;

    if (idProofType && idProofNumber) {
        existingVisitor = await prisma.visitor.findFirst({ where: { idProofType, idProofNumber } });
    }
    if (!existingVisitor) {
        existingVisitor = await prisma.visitor.findUnique({ where: { phone } });
    }

    if (existingVisitor) {
        if (existingVisitor.status === VISITOR_STATUS.DELETED) throw createError("This visitor profile has been deleted. Please contact the administrator.", 409);
        if (existingVisitor.status === VISITOR_STATUS.BLACKLISTED) throw createError("This visitor has been blacklisted and cannot be used.", 403);

        const maskedPhone = existingVisitor.phone ? '*'.repeat(Math.max(0, existingVisitor.phone.length - 4)) + existingVisitor.phone.slice(-4) : null;
        const maskedIdProofNumber = existingVisitor.idProofNumber ? '*'.repeat(Math.max(0, existingVisitor.idProofNumber.length - 4)) + existingVisitor.idProofNumber.slice(-4) : null;

        const existingRequests = await prisma.visitRequest.findMany({
            where: {
                visitorId: existingVisitor.id,
                status: { in: [VISIT_REQUEST_STATUS.PENDING, VISIT_REQUEST_STATUS.APPROVED] }
            },
            include: { student: { select: { id: true, name: true, studentHostels: { where: { status: 'active' }, select: { roomNumber: true } } } } }
        });
        const assignedStudents = existingRequests.map(r => {
            if (r.student) {
                r.student.roomNumber = r.student.studentHostels?.[0]?.roomNumber || null;
                delete r.student.studentHostels;
            }
            return r.student;
        });

        return {
            requiresConfirmation: true,
            visitorId: existingVisitor.id,
            status: existingVisitor.status,
            visitor: {
                id: existingVisitor.id,
                name: existingVisitor.name,
                email: existingVisitor.email,
                phone: maskedPhone,
                idProofType: existingVisitor.idProofType,
                idProofNumber: maskedIdProofNumber,
                status: existingVisitor.status,
                assignedStudents
            }
        };
    }

    const result = await prisma.$transaction(async (tx) => {
        const savedVisitor = await tx.visitor.create({
            data: {
                name, phone, email, idProofType, idProofNumber, address,
                status: VISITOR_STATUS.ACTIVE,
                createdById: user.id,
                changeLogs: {
                    create: {
                        action: VISITOR_CHANGE_LOG_ACTIONS.CREATED,
                        performedById: user.id,
                        performedByRole: 'parent',
                        timestamp: new Date()
                    }
                }
            }
        });

        const visitRequests = [];
        for (const sId of studentIds) {
            const savedVr = await tx.visitRequest.create({
                data: {
                    visitorId: savedVisitor.id,
                    parentId: user.id,
                    studentId: sId,
                    relationship, purpose, remarks,
                    status: VISIT_REQUEST_STATUS.PENDING
                }
            });
            visitRequests.push(savedVr);
        }
        return { savedVisitor, visitRequests };
    });

    const studentNames = students.map(s => s.name).join(', ');

    orchestratorService.triggerNotification({
        eventName: 'VISITOR_CREATED',
        target: [
            { type: 'ROLE', filter: { role: { in: ['admin'] } } },
            { type: 'MENTOR', filter: { studentIds } }
        ],
        data: {
            parentName: 'A Parent',
            visitorName: result.savedVisitor.name,
            studentNames,
            link: '/dashboard/visitors'
        }
    }).catch(err => console.error('[Notification] Error:', err));

    return {
        isNewProfile: true,
        requiresConfirmation: false,
        visitor: result.savedVisitor,
        visitRequests: result.visitRequests,
        students
    };
};

export const confirmVisitorReuseProfile = async (payload, user) => {
    const { studentIds, relationship, purpose, remarks, confirmedVisitorId } = payload;
    const { students } = await validateParentAndStudents(user.id, studentIds);

    const existingVisitor = await prisma.visitor.findUnique({ where: { id: confirmedVisitorId } });
    if (!existingVisitor) throw createError("The visitor you selected could not be found. Please try creating a new visitor.", 404);
    if (existingVisitor.status === VISITOR_STATUS.DELETED) throw createError("This visitor profile has been deleted. Please contact the administrator.", 409);
    if (existingVisitor.status === VISITOR_STATUS.BLACKLISTED) throw createError("This visitor has been blacklisted and cannot be used.", 403);

    const blockingRequests = await prisma.visitRequest.findMany({
        where: {
            visitorId: existingVisitor.id,
            studentId: { in: studentIds },
            status: { in: [VISIT_REQUEST_STATUS.PENDING, VISIT_REQUEST_STATUS.APPROVED] }
        }
    });
    const blockingStudentIds = blockingRequests.map(br => br.studentId);
    const validStudentIds = studentIds.filter(sId => !blockingStudentIds.includes(sId));

    const activeVisits = await prisma.visitorVisit.findMany({
        where: {
            visitorRefId: existingVisitor.id,
            visitorRefType: 'Visitor',
            status: { in: [VISIT_STATUS.CHECKED_IN, VISIT_STATUS.EXTENDED, VISIT_STATUS.OVERSTAYED] },
            visitStudents: { some: { studentId: { in: studentIds } } }
        }
    });
    if (activeVisits.length > 0) throw createError("This visitor is already inside the hostel visiting the selected student(s).", 409);

    if (validStudentIds.length === 0) throw createError("You have already submitted a visit request for all the selected students with this visitor. There is no need to create a new one.", 409);

    const result = await prisma.$transaction(async (tx) => {
        let visitor = existingVisitor;
        if (existingVisitor.status === VISITOR_STATUS.INACTIVE) {
            visitor = await tx.visitor.update({
                where: { id: existingVisitor.id },
                data: {
                    status: VISITOR_STATUS.ACTIVE,
                    changeLogs: {
                        create: {
                            action: VISITOR_CHANGE_LOG_ACTIONS.REACTIVATED,
                            performedById: user.id,
                            performedByRole: "parent",
                            reason: "Visitor reused after becoming inactive.",
                            timestamp: new Date()
                        }
                    }
                }
            });
        }

        const visitRequests = [];
        for (const sId of validStudentIds) {
            const savedVr = await tx.visitRequest.create({
                data: {
                    visitorId: existingVisitor.id,
                    parentId: user.id,
                    studentId: sId,
                    relationship, purpose, remarks,
                    status: VISIT_REQUEST_STATUS.PENDING
                }
            });
            visitRequests.push(savedVr);
        }
        return { visitor, visitRequests };
    });

    const activeStudents = students.filter(s => validStudentIds.includes(s.id));
    const studentNames = activeStudents.map(s => s.name).join(', ');

    orchestratorService.triggerNotification({
        eventName: 'VISITOR_CREATED',
        target: [
            { type: 'ROLE', filter: { role: { in: ['admin'] } } },
            { type: 'MENTOR', filter: { studentIds } }
        ],
        data: {
            parentName: 'A Parent',
            visitorName: existingVisitor.name,
            studentNames,
            link: '/dashboard/visitors'
        }
    }).catch(err => console.error('[Notification] Error:', err));

    return {
        isNewProfile: false,
        requiresConfirmation: false,
        visitor: result.visitor,
        visitRequests: result.visitRequests
    };
};

export const createVisitorProfile = async (payload, user) => {
    if (payload.confirmedVisitorId) return await confirmVisitorReuseProfile(payload, user);
    return await createBrandNewVisitorProfile(payload, user);
};

// ============================================================================
// Core Management & Updates
// ============================================================================

export const unassignVisitorFromStudent = async (visitorId, studentId, user) => {
    await validateParentAndStudents(user.id, [studentId]);

    const visitor = await prisma.visitor.findUnique({ where: { id: visitorId } });
    if (!visitor) throw createError('Visitor not found.', 404);
    if (visitor.status !== VISITOR_STATUS.ACTIVE) throw createError('Cannot unassign an inactive or blacklisted visitor.', 400);

    const hasActiveVisit = await prisma.visitorVisit.findFirst({
        where: {
            visitorRefId: visitorId,
            visitorRefType: 'Visitor',
            status: { in: [VISIT_STATUS.CHECKED_IN, VISIT_STATUS.EXTENDED, VISIT_STATUS.OVERSTAYED] },
            visitStudents: { some: { studentId } }
        }
    });
    if (hasActiveVisit) throw createError('Cannot unassign a visitor while an active visit is in progress.', 400);

    const cancelledRequest = await prisma.$transaction(async (tx) => {
        const visitRequest = await tx.visitRequest.findFirst({
            where: {
                visitorId,
                studentId,
                status: { in: [VISIT_REQUEST_STATUS.PENDING, VISIT_REQUEST_STATUS.APPROVED] }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!visitRequest) return null;

        return await tx.visitRequest.update({
            where: { id: visitRequest.id },
            data: { status: VISIT_REQUEST_STATUS.CANCELLED }
        });
    });

    if (!cancelledRequest) throw createError('No active assignment found for this visitor and student.', 404);
    return cancelledRequest;
};

export const updateVisitorStatus = async (visitorId, status, user, explicitStudentId = null) => {
    const visitor = await prisma.visitor.findUnique({
        where: { id: visitorId },
        include: { visitRequests: { select: { studentId: true } } }
    });
    if (!visitor) throw createError('Visitor not found.', 404);

    if (user.role === 'parent' || explicitStudentId) {
        if (![VISITOR_STATUS.INACTIVE, VISITOR_STATUS.ACTIVE].includes(status)) {
            throw createError('Parents can only change status to Active or Inactive.', 403);
        }

        let parentStudentIds = [];
        const studentParentLinks = await prisma.studentParent.findMany({ where: { parentId: user.id, status: 'active' } });

        if (explicitStudentId) {
            if (!studentParentLinks.some(link => link.studentId === explicitStudentId)) throw createError('Unauthorized access to this student.', 403);
            parentStudentIds = [explicitStudentId];
        } else {
            parentStudentIds = studentParentLinks.map(link => link.studentId);
            if (parentStudentIds.length === 0) throw createError('No linked students found.', 403);
        }

        const visitorStudentIds = visitor.visitRequests.map(vr => vr.studentId);
        if (!visitorStudentIds.some(id => parentStudentIds.includes(id))) throw createError('Unauthorized to update this visitor.', 403);

    } else if (['admin', 'super_admin'].includes(user.role)) {
        if (![VISITOR_STATUS.INACTIVE, VISITOR_STATUS.ACTIVE, VISITOR_STATUS.BLACKLISTED].includes(status)) {
            throw createError('Admins can only change status to Inactive, Active, or Blacklisted.', 403);
        }
    } else if (user.role === 'mentor') {
        if (![VISITOR_STATUS.INACTIVE, VISITOR_STATUS.ACTIVE].includes(status)) {
            throw createError('Mentors can only change status to Inactive or Active.', 403);
        }

        const activeAssignments = await prisma.mentorAssignment.findMany({
            where: { mentorId: user.id, status: 'active' },
            select: { batchId: true }
        });
        const batchIds = activeAssignments.map(a => a.batchId);

        const mentorStudents = await prisma.student.findMany({ where: { batchId: { in: batchIds } }, select: { id: true } });
        const mentorStudentIds = mentorStudents.map(s => s.id);
        const visitorStudentIds = visitor.visitRequests.map(vr => vr.studentId);

        if (!visitorStudentIds.some(id => mentorStudentIds.includes(id))) throw createError('Unauthorized to update this visitor.', 403);
    } else {
        throw createError('Unauthorized role to update visitor status.', 403);
    }

    if (visitor.status === status) throw createError(`Visitor is already ${status}.`, 400);

    let actionName = VISITOR_CHANGE_LOG_ACTIONS.UPDATED;
    if (status === VISITOR_STATUS.INACTIVE) actionName = VISITOR_CHANGE_LOG_ACTIONS.DEACTIVATED;
    else if (status === VISITOR_STATUS.ACTIVE) actionName = VISITOR_CHANGE_LOG_ACTIONS.REACTIVATED;
    else if (status === VISITOR_STATUS.BLACKLISTED) actionName = VISITOR_CHANGE_LOG_ACTIONS.BLACKLISTED;

    const roleName = user.role === 'parent' ? 'parent' : (user.role === 'mentor' ? 'mentor' : (user.role === 'super_admin' ? 'super admin' : 'admin'));

    return await prisma.visitor.update({
        where: { id: visitorId },
        data: {
            status,
            changeLogs: {
                create: {
                    action: actionName,
                    performedById: user.id,
                    performedByRole: user.role,
                    reason: `Status changed to ${status} by ${roleName}.`,
                    timestamp: new Date()
                }
            }
        }
    });
};

// ============================================================================
// Staff Visitor Listing Modules
// ============================================================================

const buildPrismaWhereClause = async (query, user, explicitStudentId = null) => {
    const where = {};
    const visitRequestWhere = {};
    const studentWhere = {};

    if (user.role === 'super_admin' && query.organization) {
        studentWhere.organizationId = query.organization;
    } else if (user.role === 'admin') {
        studentWhere.organizationId = user.organizationId || user.organization;
    } else if (user.role === 'warden') {
        const wardenHostels = await prisma.hostel.findMany({
            where: { wardens: { some: { id: user.id } } },
            select: { id: true }
        });
        if (wardenHostels.length === 0) throw createError('Unauthorized: You are not assigned to any hostel.', 403);
        studentWhere.studentHostels = { some: { hostelId: { in: wardenHostels.map(h => h.id) }, status: 'active' } };
    } else if (user.role === 'mentor') {
        const activeAssignments = await prisma.mentorAssignment.findMany({
            where: { mentorId: user.id, status: 'active' },
            select: { batchId: true }
        });
        const batchIds = activeAssignments.map(a => a.batchId);
        if (batchIds.length === 0) throw createError('EMPTY_SCOPE', 200);
        studentWhere.batchId = { in: batchIds };
    } else if (user.role === 'parent') {
        if (explicitStudentId) {
            studentWhere.id = explicitStudentId;
        } else {
            const links = await prisma.studentParent.findMany({ where: { parentId: user.id, status: 'active' } });
            studentWhere.id = { in: links.map(l => l.studentId) };
        }
        visitRequestWhere.parentId = user.id;
    } else if (user.role === 'student') {
        studentWhere.id = user.id;
    }

    if (query.hostel) {
        if (studentWhere.studentHostels) {
            studentWhere.studentHostels.some.hostelId = query.hostel;
        } else {
            studentWhere.studentHostels = { some: { hostelId: query.hostel, status: 'active' } };
        }
    }
    if (query.batch) studentWhere.batchId = query.batch;
    if (query.department) studentWhere.departmentId = query.department;
    if (query.course) studentWhere.courseId = query.course;

    if (Object.keys(studentWhere).length > 0) visitRequestWhere.student = studentWhere;
    if (Object.keys(visitRequestWhere).length > 0) where.visitRequests = { some: visitRequestWhere };

    if (query.status) where.status = query.status.trim().toUpperCase();

    if (query.date) {
        const startDate = new Date(query.date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(query.date);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt = { gte: startDate, lte: endDate };
    } else if (query.startDate && query.endDate) {
        where.createdAt = { gte: new Date(query.startDate), lte: new Date(query.endDate) };
    }

    if (query.search) {
        where.name = { contains: query.search.trim(), mode: 'insensitive' };
    }

    return where;
};

export const listVisitors = async (query, user) => {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);
    const skip = (page - 1) * limit;

    try {
        const where = await buildPrismaWhereClause(query, user);

        let orderBy = { createdAt: 'desc' };
        if (query.sort === 'asc') orderBy = { createdAt: 'asc' };

        const [total, data] = await Promise.all([
            prisma.visitor.count({ where }),
            prisma.visitor.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    visitRequests: {
                        where: { status: { in: [VISIT_REQUEST_STATUS.PENDING, VISIT_REQUEST_STATUS.APPROVED] } },
                        include: { student: { select: { id: true, name: true, studentHostels: { where: { status: 'active' }, select: { roomNumber: true } } } } }
                    }
                }
            })
        ]);

        return { total, page, limit, totalPages: Math.ceil(total / limit), data: data.map(mapStudentRoomNumber) };
    } catch (error) {
        if (error.message === 'EMPTY_SCOPE') return { total: 0, page, limit, totalPages: 0, data: [] };
        throw error;
    }
};

export const listParentVisitors = async (query, user, explicitStudentId = null) => {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);
    const skip = (page - 1) * limit;

    user.role = 'parent';
    const where = await buildPrismaWhereClause(query, user, explicitStudentId);

    let orderBy = { createdAt: 'desc' };
    if (query.sort === 'asc') orderBy = { createdAt: 'asc' };

    const [total, data] = await Promise.all([
        prisma.visitor.count({ where }),
        prisma.visitor.findMany({
            where, skip, take: limit, orderBy,
            include: {
                visitRequests: {
                    where: { status: { in: [VISIT_REQUEST_STATUS.PENDING, VISIT_REQUEST_STATUS.APPROVED] } },
                    include: { student: { select: { id: true, name: true, studentHostels: { where: { status: 'active' }, select: { roomNumber: true } } } } }
                }
            }
        })
    ]);

    return { total, page, limit, totalPages: Math.ceil(total / limit), data: data.map(mapStudentRoomNumber) };
};

export const listStudentVisitors = async (query, user) => {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);
    const skip = (page - 1) * limit;

    user.role = 'student';
    const where = await buildPrismaWhereClause(query, user);

    let orderBy = { createdAt: 'desc' };
    if (query.sort === 'asc') orderBy = { createdAt: 'asc' };

    const [total, data] = await Promise.all([
        prisma.visitor.count({ where }),
        prisma.visitor.findMany({
            where, skip, take: limit, orderBy,
            include: {
                visitRequests: {
                    where: { status: { in: [VISIT_REQUEST_STATUS.PENDING, VISIT_REQUEST_STATUS.APPROVED] } },
                    include: { student: { select: { id: true, name: true, studentHostels: { where: { status: 'active' }, select: { roomNumber: true } } } } }
                }
            }
        })
    ]);

    return { total, page, limit, totalPages: Math.ceil(total / limit), data: data.map(mapStudentRoomNumber) };
};

export const getVisitorDetails = async (visitorId, user, explicitStudentId = null) => {
    const visitor = await prisma.visitor.findUnique({
        where: { id: visitorId },
        include: {
            visitRequests: {
                where: { status: { in: [VISIT_REQUEST_STATUS.PENDING, VISIT_REQUEST_STATUS.APPROVED] } },
                include: {
                    student: {
                        select: { id: true, name: true, studentHostels: { where: { status: 'active' }, select: { roomNumber: true, hostel: { select: { name: true } } } }, batchId: true, organizationId: true }
                    }
                }
            }
        }
    });

    if (!visitor) throw createError('Visitor not found.', 404);

    let order = { [VISIT_REQUEST_STATUS.PENDING]: 1, [VISIT_REQUEST_STATUS.APPROVED]: 2 };
    if (!['admin', 'super_admin', 'mentor'].includes(user.role)) {
        order = { [VISIT_REQUEST_STATUS.APPROVED]: 1, [VISIT_REQUEST_STATUS.PENDING]: 2 };
    }

    visitor.visitRequests.sort((a, b) => {
        const orderA = order[a.status] || 3;
        const orderB = order[b.status] || 3;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Mask sensitive info for restricted roles
    if (['warden', 'mentor', 'student'].includes(user.role)) {
        visitor.phone = visitor.phone ? '*'.repeat(Math.max(0, visitor.phone.length - 4)) + visitor.phone.slice(-4) : null;
        visitor.idProofNumber = visitor.idProofNumber ? '*'.repeat(Math.max(0, visitor.idProofNumber.length - 4)) + visitor.idProofNumber.slice(-4) : null;
    }

    return mapStudentRoomNumber(visitor);
};
