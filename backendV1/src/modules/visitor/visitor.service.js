import { prisma } from '../../config/prisma.js';
import * as visitorRepository from './visitor.repository.js';
import { orchestratorService } from '../notifications/services/orchestrator.service.js';
import { ROLES } from '../../constants/roles.js';
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
    const currentParent = await visitorRepository.findParentById(parentId);
    if (!currentParent) throw createError("We couldn't find your parent profile. Please try logging in again.", 404);
    if (!currentParent.isActive || !currentParent.isVerified) {
        throw createError("Your account is currently inactive or not verified. Please contact the hostel administration for assistance.", 403);
    }

    // 2. Validate Students
    const authorizedStudentIds = await visitorRepository.findParentStudentIds(parentId);

    for (const sId of studentIds) {
        if (!authorizedStudentIds.includes(sId)) {
            throw createError("You do not have permission to schedule visits for one of the selected students.", 403);
        }
    }

    const students = await visitorRepository.findStudentsWithHostels(studentIds);
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

    const existingVisitor = await visitorRepository.findExistingVisitorByIdProofOrPhone({ idProofType, idProofNumber, phone });

    if (existingVisitor) {
        if (existingVisitor.status === VISITOR_STATUS.DELETED) throw createError("This visitor profile has been deleted. Please contact the administrator.", 409);
        if (existingVisitor.status === VISITOR_STATUS.BLACKLISTED) throw createError("This visitor has been blacklisted and cannot be used.", 403);

        const maskedPhone = existingVisitor.phone ? '*'.repeat(Math.max(0, existingVisitor.phone.length - 4)) + existingVisitor.phone.slice(-4) : null;
        const maskedIdProofNumber = existingVisitor.idProofNumber ? '*'.repeat(Math.max(0, existingVisitor.idProofNumber.length - 4)) + existingVisitor.idProofNumber.slice(-4) : null;

        const existingRequests = await visitorRepository.findVisitorPendingOrApprovedRequests(existingVisitor.id);
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
                        performedByRole: ROLES.PARENT,
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
            { type: 'ROLE', filter: { role: { in: [ROLES.ADMIN] } } },
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

    const existingVisitor = await visitorRepository.findVisitorById(confirmedVisitorId);
    if (!existingVisitor) throw createError("The visitor you selected could not be found. Please try creating a new visitor.", 404);
    if (existingVisitor.status === VISITOR_STATUS.DELETED) throw createError("This visitor profile has been deleted. Please contact the administrator.", 409);
    if (existingVisitor.status === VISITOR_STATUS.BLACKLISTED) throw createError("This visitor has been blacklisted and cannot be used.", 403);

    const blockingRequests = await visitorRepository.findBlockingVisitRequests(existingVisitor.id, studentIds);
    const blockingStudentIds = blockingRequests.map(br => br.studentId);
    const validStudentIds = studentIds.filter(sId => !blockingStudentIds.includes(sId));

    const activeVisits = await visitorRepository.findActiveVisitsForVisitor(existingVisitor.id, studentIds);
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
                            performedByRole: ROLES.PARENT,
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
            { type: 'ROLE', filter: { role: { in: [ROLES.ADMIN] } } },
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

    const visitor = await visitorRepository.findVisitorById(visitorId);
    if (!visitor) throw createError('Visitor not found.', 404);
    if (visitor.status !== VISITOR_STATUS.ACTIVE) throw createError('Cannot unassign an inactive or blacklisted visitor.', 400);

    const activeVisits = await visitorRepository.findActiveVisitsForVisitor(visitorId, [studentId]);
    if (activeVisits.length > 0) throw createError('Cannot unassign a visitor while an active visit is in progress.', 400);

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

export const updateVisitorStatus = async (visitorId, status, user, studentId = null) => {
    const visitor = await visitorRepository.findVisitorWithStudentIds(visitorId);
    if (!visitor) throw createError('Visitor not found.', 404);

    if (user.role === ROLES.PARENT || studentId) {
        if (![VISITOR_STATUS.INACTIVE, VISITOR_STATUS.ACTIVE].includes(status)) {
            throw createError('Parents can only change status to Active or Inactive.', 403);
        }

        let parentStudentIds = [];
        const linkedStudentIds = await visitorRepository.findParentStudentIds(user.id);

        if (studentId) {
            if (!linkedStudentIds.includes(studentId)) throw createError('Unauthorized access to this student.', 403);
            parentStudentIds = [studentId];
        } else {
            parentStudentIds = linkedStudentIds;
            if (parentStudentIds.length === 0) throw createError('No linked students found.', 403);
        }

        const visitorStudentIds = visitor.visitRequests.map(vr => vr.studentId);
        if (!visitorStudentIds.some(id => parentStudentIds.includes(id))) throw createError('Unauthorized to update this visitor.', 403);

    } else if ([ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user.role)) {
        if (![VISITOR_STATUS.INACTIVE, VISITOR_STATUS.ACTIVE, VISITOR_STATUS.BLACKLISTED].includes(status)) {
            throw createError('Admins can only change status to Inactive, Active, or Blacklisted.', 403);
        }
    } else if (user.role === ROLES.MENTOR) {
        if (![VISITOR_STATUS.INACTIVE, VISITOR_STATUS.ACTIVE].includes(status)) {
            throw createError('Mentors can only change status to Inactive or Active.', 403);
        }

        const batchIds = await visitorRepository.findMentorBatchIds(user.id);
        const mentorStudentIds = await visitorRepository.findStudentIdsByBatchIds(batchIds);
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

    const roleName = user.role === ROLES.PARENT ? ROLES.PARENT : (user.role === ROLES.MENTOR ? ROLES.MENTOR : (user.role === ROLES.SUPER_ADMIN ? 'super admin' : ROLES.ADMIN));

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

const buildPrismaWhereClause = async (query, user, studentId = null) => {
    const where = {};
    const visitRequestWhere = {};
    const studentWhere = {};

    if (user.role === ROLES.SUPER_ADMIN && query.organization) {
        studentWhere.organizationId = query.organization;
    } else if (user.role === ROLES.ADMIN) {
        studentWhere.organizationId = user.organizationId || user.organization;
    } else if (user.role === ROLES.WARDEN) {
        const wardenHostelIds = await visitorRepository.findWardenHostelIds(user.id);
        if (wardenHostelIds.length === 0) throw createError('Unauthorized: You are not assigned to any hostel.', 403);
        studentWhere.studentHostels = { some: { hostelId: { in: wardenHostelIds }, status: 'active' } };
    } else if (user.role === ROLES.MENTOR) {
        const batchIds = await visitorRepository.findMentorBatchIds(user.id);
        if (batchIds.length === 0) throw createError('EMPTY_SCOPE', 200);
        studentWhere.batchId = { in: batchIds };
    } else if (user.role === ROLES.PARENT) {
        if (studentId) {
            studentWhere.id = studentId;
        } else {
            const studentIds = await visitorRepository.findParentStudentIds(user.id);
            studentWhere.id = { in: studentIds };
        }
        visitRequestWhere.parentId = user.id;
    } else if (user.role === ROLES.STUDENT) {
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

        const { total, data } = await visitorRepository.findVisitorsPaginated(where, { skip, limit, orderBy });

        return { total, page, limit, totalPages: Math.ceil(total / limit), data: data.map(mapStudentRoomNumber) };
    } catch (error) {
        if (error.message === 'EMPTY_SCOPE') return { total: 0, page, limit, totalPages: 0, data: [] };
        throw error;
    }
};

export const listParentVisitors = async (query, user, studentId = null) => {
    const clonedUser = { ...user, role: ROLES.PARENT };
    return await listVisitors(query, clonedUser);
};

export const listStudentVisitors = async (query, user) => {
    const clonedUser = { ...user, role: ROLES.STUDENT };
    return await listVisitors(query, clonedUser);
};

export const getVisitorDetails = async (visitorId, user, studentId = null) => {
    const visitor = await visitorRepository.findVisitorDetailsById(visitorId);

    if (!visitor) throw createError('Visitor not found.', 404);

    if (user.role === ROLES.PARENT) {
        let parentStudentIds = [];
        if (studentId) {
            const link = await visitorRepository.findParentStudentLink(user.id, studentId);
            if (!link) throw createError('Unauthorized access to this student.', 403);
            parentStudentIds = [studentId];
        } else {
            parentStudentIds = await visitorRepository.findParentStudentIds(user.id);
        }
        const visitorStudentIds = visitor.visitRequests.map(vr => vr.studentId);
        if (!visitorStudentIds.some(id => parentStudentIds.includes(id))) {
            throw createError('Unauthorized: You do not have access to view this visitor.', 403);
        }
    } else if (user.role === ROLES.STUDENT) {
        const visitorStudentIds = visitor.visitRequests.map(vr => vr.studentId);
        if (!visitorStudentIds.includes(user.id)) {
            throw createError('Unauthorized: You do not have access to view this visitor.', 403);
        }
    }

    let order = { [VISIT_REQUEST_STATUS.PENDING]: 1, [VISIT_REQUEST_STATUS.APPROVED]: 2 };
    if (![ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MENTOR].includes(user.role)) {
        order = { [VISIT_REQUEST_STATUS.APPROVED]: 1, [VISIT_REQUEST_STATUS.PENDING]: 2 };
    }

    visitor.visitRequests.sort((a, b) => {
        const orderA = order[a.status] || 3;
        const orderB = order[b.status] || 3;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Mask sensitive info for restricted roles
    if ([ROLES.WARDEN, ROLES.MENTOR, ROLES.STUDENT].includes(user.role)) {
        visitor.phone = visitor.phone ? '*'.repeat(Math.max(0, visitor.phone.length - 4)) + visitor.phone.slice(-4) : null;
        visitor.idProofNumber = visitor.idProofNumber ? '*'.repeat(Math.max(0, visitor.idProofNumber.length - 4)) + visitor.idProofNumber.slice(-4) : null;
    }

    return mapStudentRoomNumber(visitor);
};

// ============================================================================
// Visitor Dashboard Summary Service
// ============================================================================

export const getDashboardSummary = async (user) => {
    const role = user.role;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const now = new Date();

    const cards = [];

    switch (role) {
        case ROLES.SUPER_ADMIN: {
            const { total, pending, inside, todaysVisits } = await visitorRepository.getSuperAdminDashboardCounts({ today, endOfToday });
            cards.push(
                { key: "total_visitors", title: "Total Visitors", value: total },
                { key: "pending", title: "Pending Approval", value: pending },
                { key: "visitors_inside", title: "Visitors Inside", value: inside },
                { key: "todays_visits", title: "Today's Visits", value: todaysVisits }
            );
            break;
        }

        case ROLES.ADMIN: {
            const organizationId = user.organizationId || user.organization;
            const { pending, approved, inside, todaysVisits } = await visitorRepository.getAdminDashboardCounts(organizationId, { today, endOfToday });
            cards.push(
                { key: "pending", title: "Pending Approval", value: pending },
                { key: "approved", title: "Approved Visitors", value: approved },
                { key: "visitors_inside", title: "Visitors Inside", value: inside },
                { key: "todays_visits", title: "Today's Visits", value: todaysVisits }
            );
            break;
        }

        case ROLES.WARDEN: {
            const hostelIds = await visitorRepository.findWardenHostelIds(user.id);
            if (!hostelIds || hostelIds.length === 0) {
                throw createError('Unauthorized: Not assigned to any hostel.', 403);
            }

            const { inside, todaysCheckIns, todaysCheckOuts, overstayed } = await visitorRepository.getWardenDashboardCounts(hostelIds, { today, endOfToday, now });
            cards.push(
                { key: "visitors_inside", title: "Visitors Inside", value: inside },
                { key: "todays_check_ins", title: "Today's Check-Ins", value: todaysCheckIns },
                { key: "todays_check_outs", title: "Today's Check-Outs", value: todaysCheckOuts },
                { key: "overstayed", title: "Overstayed Visitors", value: overstayed }
            );
            break;
        }

        case ROLES.PARENT: {
            const studentIds = await visitorRepository.findParentStudentIds(user.id);

            if (studentIds.length === 0) {
                return {
                    cards: [
                        { key: "my_visitors", title: "My Visitors", value: 0 },
                        { key: "pending", title: "Pending Approval", value: 0 },
                        { key: "approved", title: "Approved Visitors", value: 0 },
                        { key: "rejected", title: "Rejected Visitors", value: 0 }
                    ]
                };
            }

            const { myVisitors, pending, approved, rejected } = await visitorRepository.getParentDashboardCounts(user.id, studentIds);
            cards.push(
                { key: "my_visitors", title: "My Visitors", value: myVisitors },
                { key: "pending", title: "Pending Approval", value: pending },
                { key: "approved", title: "Approved Visitors", value: approved },
                { key: "rejected", title: "Rejected Visitors", value: rejected }
            );
            break;
        }

        case ROLES.STUDENT: {
            const { approved, pending, todaysVisits, total } = await visitorRepository.getStudentDashboardCounts(user.id, { today, endOfToday });
            cards.push(
                { key: "my_approved_visitors", title: "My Approved Visitors", value: approved },
                { key: "pending", title: "Pending Visitors", value: pending },
                { key: "todays_visits", title: "Today's Visits", value: todaysVisits },
                { key: "total_visitors", title: "Total Visitors", value: total }
            );
            break;
        }

        default:
            throw createError('Unauthorized role.', 403);
    }

    return { cards };
};

// ============================================================================
// Visitor Visit History Services
// ============================================================================

export const listVisitorVisits = async (query, user, explicitStudentId = null) => {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);
    const skip = (page - 1) * limit;

    const where = {};

    if (user.role === ROLES.SUPER_ADMIN) {
        if (query.hostel) {
            where.hostelId = query.hostel;
        }
    } else if (user.role === ROLES.ADMIN) {
        const organizationId = user.organizationId || user.organization;
        if (organizationId) {
            where.visitStudents = {
                some: { student: { organizationId } }
            };
        }
        if (query.hostel) {
            where.hostelId = query.hostel;
        }
    } else if (user.role === ROLES.WARDEN) {
        const wardenHostelIds = await visitorRepository.findWardenHostelIds(user.id);
        if (!wardenHostelIds || wardenHostelIds.length === 0) {
            throw createError('Unauthorized: You are not assigned to any hostel.', 403);
        }
        where.hostelId = { in: wardenHostelIds };
    } else if (user.role === ROLES.MENTOR) {
        const batchIds = await visitorRepository.findMentorBatchIds(user.id);
        if (batchIds.length === 0) {
            return { total: 0, page, limit, totalPages: 0, data: [] };
        }
        where.visitStudents = {
            some: { student: { batchId: { in: batchIds } } }
        };
        if (query.hostel) {
            where.hostelId = query.hostel;
        }
    } else if (user.role === ROLES.PARENT || explicitStudentId) {
        let authorizedStudentIds = [];
        const studentParentLinks = await visitorRepository.findParentStudentIds(user.id);

        if (explicitStudentId) {
            const isAuthorized = studentParentLinks.includes(explicitStudentId);
            if (!isAuthorized) {
                throw createError('Unauthorized access to this student.', 403);
            }
            authorizedStudentIds = [explicitStudentId];
        } else {
            authorizedStudentIds = studentParentLinks;
        }

        if (authorizedStudentIds.length === 0) {
            return { total: 0, page, limit, totalPages: 0, data: [] };
        }

        where.visitStudents = {
            some: { studentId: { in: authorizedStudentIds } }
        };
    } else if (user.role === ROLES.STUDENT) {
        where.visitStudents = {
            some: { studentId: user.id }
        };
    } else {
        throw createError('Unauthorized role to list visitor visits.', 403);
    }

    if (query.status) {
        where.status = query.status.toUpperCase();
    }

    if (query.startDate || query.endDate) {
        where.checkInTime = {};
        if (query.startDate) {
            const start = new Date(query.startDate);
            start.setHours(0, 0, 0, 0);
            where.checkInTime.gte = start;
        }
        if (query.endDate) {
            const end = new Date(query.endDate);
            end.setHours(23, 59, 59, 999);
            where.checkInTime.lte = end;
        }
    }

    let orderBy = { checkInTime: 'desc' };
    if (query.sortBy) {
        const order = query.sortOrder === 'asc' ? 'asc' : 'desc';
        orderBy = { [query.sortBy]: order };
    }

    const { total, rawVisits } = await visitorRepository.findVisitorVisitsPaginated(where, { skip, limit, orderBy });

    const visitorRefIds = [...new Set(rawVisits.map(v => v.visitorRefId))];
    const visitors = await visitorRepository.findVisitorProfilesByIds(visitorRefIds);
    const visitorMap = new Map(visitors.map(v => [v.id, v]));

    const formattedData = rawVisits.map(visit => {
        const visitor = visitorMap.get(visit.visitorRefId);
        const studentNames = visit.visitStudents.map(vs => vs.student.name).join(', ');
        return {
            id: visit.id,
            visitId: visit.id,
            visitorName: visitor?.name || 'Unknown',
            visitorPhone: visitor?.phone || null,
            studentNames,
            hostelName: visit.hostel?.name || null,
            purpose: visit.purpose,
            status: visit.status,
            checkInTime: visit.checkInTime,
            expectedExitTime: visit.expectedExitTime,
            checkOutTime: visit.checkOutTime,
            students: visit.visitStudents.map(vs => ({
                id: vs.student.id,
                name: vs.student.name,
                roomNumber: vs.student.studentHostels?.[0]?.roomNumber || null
            }))
        };
    });

    let finalData = formattedData;
    if (query.search) {
        const term = query.search.toLowerCase();
        finalData = formattedData.filter(v =>
            (v.visitorName && v.visitorName.toLowerCase().includes(term)) ||
            (v.studentNames && v.studentNames.toLowerCase().includes(term)) ||
            (v.visitorPhone && v.visitorPhone.includes(term))
        );
    }

    return {
        total: query.search ? finalData.length : total,
        page,
        limit,
        totalPages: Math.ceil((query.search ? finalData.length : total) / limit),
        data: finalData
    };
};

export const getVisitDetails = async (visitId, user, explicitStudentId = null) => {
    const visit = await prisma.visitorVisit.findUnique({
        where: { id: visitId },
        include: {
            hostel: { select: { id: true, name: true } },
            checkedInBy: { select: { id: true, name: true, role: true } },
            checkedOutBy: { select: { id: true, name: true, role: true } },
            visitTimeline: {
                orderBy: { createdAt: 'desc' },
                include: { performedBy: { select: { name: true, role: true } } }
            },
            visitStudents: {
                include: {
                    student: {
                        select: {
                            id: true,
                            name: true,
                            organizationId: true,
                            batchId: true,
                            studentHostels: { where: { status: 'active' }, select: { roomNumber: true, hostel: { select: { id: true, name: true } } } }
                        }
                    }
                }
            }
        }
    });

    if (!visit) {
        throw createError('Visitor visit not found.', 404);
    }

    const visitor = await prisma.visitor.findUnique({
        where: { id: visit.visitorRefId },
        include: { createdBy: { select: { relationship: true } } }
    });

    const visitStudentIds = visit.visitStudents.map(vs => vs.student.id);
    let visibleStudentIds = [...visitStudentIds];

    if (user.role === ROLES.ADMIN) {
        const organizationId = user.organizationId || user.organization;
        const orgMatch = visit.visitStudents.some(vs => vs.student.organizationId === organizationId);
        if (!orgMatch) {
            throw createError('Unauthorized: Organization mismatch.', 403);
        }
    } else if (user.role === ROLES.WARDEN) {
        const wardenHostels = await prisma.hostel.findMany({
            where: { wardens: { some: { id: user.id } } },
            select: { id: true }
        });
        const wardenHostelIds = wardenHostels.map(h => h.id);
        if (!wardenHostelIds.includes(visit.hostelId)) {
            throw createError('Unauthorized: You are not assigned to this hostel.', 403);
        }
    } else if (user.role === ROLES.STUDENT) {
        if (!visitStudentIds.includes(user.id)) {
            throw createError('Unauthorized: Visit not assigned to this student.', 403);
        }
        visibleStudentIds = [user.id];
    } else if (user.role === ROLES.PARENT || explicitStudentId) {
        let authorizedStudentIds = [];
        const studentParentLinks = await prisma.studentParent.findMany({
            where: { parentId: user.id, status: 'active' }
        });

        if (explicitStudentId) {
            const isAuthorized = studentParentLinks.some(link => link.studentId === explicitStudentId);
            if (!isAuthorized) {
                throw createError('Unauthorized access to this student.', 403);
            }
            authorizedStudentIds = [explicitStudentId];
        } else {
            authorizedStudentIds = studentParentLinks.map(link => link.studentId);
        }

        visibleStudentIds = authorizedStudentIds.filter(id => visitStudentIds.includes(id));
        if (visibleStudentIds.length === 0) {
            throw createError('Unauthorized: Visit not linked to your authorized students.', 403);
        }
    }

    let maskedIdProofNumber = null;
    if (visitor && visitor.idProofNumber) {
        if ([ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(user.role)) {
            maskedIdProofNumber = visitor.idProofNumber;
        } else {
            const num = visitor.idProofNumber;
            maskedIdProofNumber = num.length > 4 ? '*'.repeat(num.length - 4) + num.slice(-4) : '****';
        }
    }

    const formattedTimeline = visit.visitTimeline.map(t => ({
        action: t.action,
        performedBy: t.performedBy ? t.performedBy.name : 'System',
        role: t.performedBy ? t.performedBy.role : 'System',
        remarks: t.remarks,
        createdAt: t.createdAt
    }));

    const formattedStudents = visit.visitStudents
        .filter(vs => visibleStudentIds.includes(vs.student.id))
        .map(vs => ({
            studentId: vs.student.id,
            studentName: vs.student.name,
            roomNumber: vs.student.studentHostels?.[0]?.roomNumber || null,
            hostelDetails: {
                hostelId: vs.student.studentHostels?.[0]?.hostel?.id || visit.hostelId,
                hostelName: vs.student.studentHostels?.[0]?.hostel?.name || visit.hostel?.name || null
            }
        }));

    let visitDuration = null;
    if (visit.checkOutTime && visit.checkInTime) {
        const diffMs = new Date(visit.checkOutTime) - new Date(visit.checkInTime);
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        visitDuration = `${hours}h ${minutes}m`;
    } else if (visit.checkInTime) {
        const diffMs = new Date() - new Date(visit.checkInTime);
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        visitDuration = `${hours}h ${minutes}m (Ongoing)`;
    }

    const studentNames = formattedStudents.map(s => s.studentName).join(', ');
    const visitorName = visitor ? visitor.name : 'Unknown';

    return {
        quickSummary: {
            visitorName,
            studentNames,
            currentStatus: visit.status,
            visitDuration,
            checkIn: visit.checkInTime,
            checkOut: visit.checkOutTime
        },
        visitorInformation: visitor ? {
            visitorId: visitor.id,
            visitorName: visitor.name,
            phone: visitor.phone,
            relationship: visitor.createdBy?.relationship || null,
            address: visitor.address,
            idProofType: visitor.idProofType,
            idProofNumber: maskedIdProofNumber
        } : null,
        visitInformation: {
            visitId: visit.id,
            purpose: visit.purpose,
            status: visit.status,
            checkInTime: visit.checkInTime,
            expectedExitTime: visit.expectedExitTime,
            checkOutTime: visit.checkOutTime,
            visitDuration
        },
        studentInformation: formattedStudents,
        wardenInformation: {
            checkedInBy: visit.checkedInBy ? { name: visit.checkedInBy.name, role: visit.checkedInBy.role } : null,
            checkedOutBy: visit.checkedOutBy ? { name: visit.checkedOutBy.name, role: visit.checkedOutBy.role } : null
        },
        timeline: formattedTimeline
    };
};

export const getSuperAdminHostelVisits = async (query, user) => {
    if (user.role !== ROLES.SUPER_ADMIN) {
        throw createError('Unauthorized role.', 403);
    }

    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);
    const skip = (page - 1) * limit;
    const search = query.search ? query.search.trim().toLowerCase() : null;

    const visitGroups = await visitorRepository.getSuperAdminHostelVisitStats();

    const hostelStatsMap = new Map();
    for (const group of visitGroups) {
        const hostelId = group.hostelId;
        if (!hostelStatsMap.has(hostelId)) {
            hostelStatsMap.set(hostelId, { totalVisits: 0, inside: 0, completed: 0 });
        }
        const stats = hostelStatsMap.get(hostelId);
        const count = group._count.id;
        stats.totalVisits += count;

        if (['CHECKED_IN', 'EXTENDED', 'OVERSTAYED'].includes(group.status)) {
            stats.inside += count;
        } else if (['CHECKED_OUT', 'COMPLETED'].includes(group.status)) {
            stats.completed += count;
        }
    }

    const hostelIdsWithVisits = Array.from(hostelStatsMap.keys());

    if (hostelIdsWithVisits.length === 0) {
        return {
            total: 0,
            page,
            limit,
            totalPages: 0,
            data: []
        };
    }

    const hostels = await visitorRepository.findHostelsWithWardens(hostelIdsWithVisits, search);

    const total = hostels.length;
    const paginatedHostels = hostels.slice(skip, skip + limit);

    const data = paginatedHostels.map(h => {
        const stats = hostelStatsMap.get(h.id) || { totalVisits: 0, inside: 0, completed: 0 };
        const wardenNames = h.wardens.map(w => w.user.name).filter(Boolean);
        const wardenName = wardenNames.length > 0 ? wardenNames.join(', ') : 'Unassigned';

        return {
            hostelId: h.id,
            hostelName: h.name || 'Unknown',
            totalVisits: stats.totalVisits,
            inside: stats.inside,
            completed: stats.completed,
            wardenName
        };
    });

    return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        data
    };
};

// ============================================================================
// Visit Request Approval & Rejection Services
// ============================================================================

export const authorizeVisitRequest = async (visitRequestId, user) => {
    if (![ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MENTOR].includes(user.role)) {
        throw createError('Unauthorized role.', 403);
    }

    const visitRequest = await visitorRepository.findVisitRequestForAuthorization(visitRequestId);

    if (!visitRequest) {
        throw createError('VisitRequest not found.', 404);
    }

    if (user.role === ROLES.SUPER_ADMIN) {
        return visitRequest;
    }

    const student = visitRequest.student;
    if (!student) {
        throw createError('VisitRequest student data not found for authorization.', 500);
    }

    if (user.role === ROLES.ADMIN) {
        const userOrgId = user.organizationId || user.organization;
        if (!student.organizationId || student.organizationId !== userOrgId) {
            throw createError('Student is outside your organization scope.', 403);
        }
        return visitRequest;
    }

    if (user.role === ROLES.MENTOR) {
        const activeBatchIds = await visitorRepository.findMentorBatchIds(user.id);
        if (!student.batchId || !activeBatchIds.includes(student.batchId)) {
            throw createError('Student is not in your assigned active batches.', 403);
        }
        return visitRequest;
    }

    throw createError('Authorization failed.', 403);
};

export const approveVisitRequest = async (visitRequestId, user) => {
    const visitRequest = await authorizeVisitRequest(visitRequestId, user);

    if (visitRequest.status !== VISIT_REQUEST_STATUS.PENDING) {
        throw createError(`Invalid status transition from ${visitRequest.status} to APPROVED.`, 400);
    }

    const updatedRequest = await prisma.$transaction(async (tx) => {
        const updated = await tx.visitRequest.update({
            where: { id: visitRequestId },
            data: { status: VISIT_REQUEST_STATUS.APPROVED }
        });

        await tx.visitRequestTimeline.create({
            data: {
                visitRequestId,
                action: 'APPROVED',
                performedById: user.id,
                performedByRole: user.role,
                remarks: `Approved by ${user.role}`
            }
        });

        return updated;
    });

    try {
        const student = visitRequest.student;
        const studentName = student?.name || 'Student';
        const senderInfo = { id: user.id, model: 'User', snapshot: { name: user.name, role: user.role } };
        const studentIdStr = visitRequest.studentId;

        const targets = [
            { type: 'PARENT', filter: { studentIds: [studentIdStr] } },
            { type: 'STUDENT', filter: { studentIds: [studentIdStr] } },
            { type: 'MENTOR', filter: { studentIds: [studentIdStr] } }
        ];

        const wardens = student?.studentHostels?.[0]?.hostel?.wardens || [];
        if (wardens.length > 0) {
            targets.push({ type: 'USER', filter: { userIds: wardens.map(w => w.userId) } });
        }

        await orchestratorService.triggerNotification({
            eventName: 'VISITOR_APPROVED',
            target: targets,
            data: { visitorName: visitRequest.visitor?.name || 'Visitor', studentNames: studentName, link: '/dashboard/visitors' },
            sender: senderInfo
        });
    } catch (e) {
        console.error('[VisitorService] Failed to publish VISITOR_APPROVED event:', e);
    }

    return updatedRequest;
};

export const rejectVisitRequest = async (visitRequestId, reason, user) => {
    const visitRequest = await authorizeVisitRequest(visitRequestId, user);

    if (visitRequest.status !== VISIT_REQUEST_STATUS.PENDING) {
        throw createError(`Invalid status transition from ${visitRequest.status} to REJECTED.`, 400);
    }

    const updatedRequest = await prisma.$transaction(async (tx) => {
        const updated = await tx.visitRequest.update({
            where: { id: visitRequestId },
            data: { status: VISIT_REQUEST_STATUS.REJECTED }
        });

        await tx.visitRequestTimeline.create({
            data: {
                visitRequestId,
                action: 'REJECTED',
                performedById: user.id,
                performedByRole: user.role,
                remarks: reason
            }
        });

        return updated;
    });

    try {
        const studentIdStr = visitRequest.studentId;
        const senderInfo = { id: user.id, model: 'User', snapshot: { name: user.name, role: user.role } };

        await orchestratorService.triggerNotification({
            eventName: 'VISITOR_REJECTED',
            target: [
                { type: 'PARENT', filter: { studentIds: [studentIdStr] } },
                { type: 'STUDENT', filter: { studentIds: [studentIdStr] } }
            ],
            data: { visitorName: visitRequest.visitor?.name || 'Visitor', reason: reason, link: '/dashboard/visitors' },
            sender: senderInfo
        });
    } catch (e) {
        console.error('[VisitorService] Failed to publish VISITOR_REJECTED event:', e);
    }

    return updatedRequest;
};

// ============================================================================
// Warden Check-In Visitor Service
// ============================================================================

export const checkInVisitor = async (payload, wardenUser) => {
    if (wardenUser.role !== ROLES.WARDEN) {
        throw createError('Unauthorized: Only wardens can manage visits.', 403);
    }

    const { visitor, selectedStudentIds, purpose, expectedExitTime } = payload;
    const uniqueStudentIds = [...new Set(selectedStudentIds)];

    const students = await visitorRepository.findStudentsWithHostelWardens(uniqueStudentIds);

    if (students.length !== uniqueStudentIds.length) {
        throw createError('One or more selected students not found.', 400);
    }

    for (const student of students) {
        if (!student.studentHostels || student.studentHostels.length === 0) {
            throw createError(`Student ${student.name} does not have an active hostel status.`, 400);
        }
    }

    const targetHostelId = students[0].studentHostels[0].hostelId;
    const targetOrgId = students[0].organizationId;

    for (const student of students) {
        const studentHostelId = student.studentHostels[0].hostelId;
        if (studentHostelId !== targetHostelId) {
            throw createError(`Student ${student.name} belongs to a different hostel. Must check-in separately.`, 400);
        }
        if (student.organizationId !== targetOrgId) {
            throw createError(`Student ${student.name} belongs to a different organization.`, 400);
        }
    }

    const targetHostelWardens = students[0].studentHostels[0].hostel.wardens.map(w => w.userId);
    if (!targetHostelWardens.includes(wardenUser.id)) {
        throw createError('Unauthorized: You are not assigned to the hostel for these students.', 403);
    }

    let personName = 'Visitor';
    if (visitor.refType === 'Parent') {
        const parentDoc = await visitorRepository.findParentById(visitor.refId);
        if (!parentDoc) throw createError('Parent profile no longer exists.', 404);
        if (!parentDoc.isActive) throw createError('Parent profile is inactive.', 400);
        if (!parentDoc.isVerified) throw createError('Parent profile is not verified.', 400);
        personName = parentDoc.parentName || parentDoc.name || 'Parent';
    } else {
        const visitorDoc = await visitorRepository.findVisitorById(visitor.refId);
        if (!visitorDoc) throw createError('Visitor profile no longer exists.', 404);
        if (visitorDoc.status === 'INACTIVE') throw createError('Visitor profile is inactive.', 400);
        if (visitorDoc.status === 'BLACKLISTED') throw createError('Visitor profile is blacklisted.', 400);
        if (visitorDoc.status === 'DELETED') throw createError('Visitor profile is deleted.', 400);
        personName = visitorDoc.name;

        const approvedRequests = await visitorRepository.findApprovedRequestsForVisitor(visitor.refId, uniqueStudentIds);
        for (const sId of uniqueStudentIds) {
            const vr = approvedRequests.find(v => v.studentId === sId);
            if (!vr) {
                throw createError(`VisitRequest for student is not Approved or missing.`, 400);
            }
        }
    }

    const existingActiveVisit = await visitorRepository.findActiveCheckInVisit(visitor.refId, visitor.refType);

    if (existingActiveVisit) {
        throw createError('This visitor is already checked in. Please add students to the active visit instead.', 409);
    }

    const now = new Date();
    const parsedExpectedExitTime = new Date(expectedExitTime);

    const newVisit = await prisma.$transaction(async (tx) => {
        const createdVisit = await tx.visitorVisit.create({
            data: {
                hostelId: targetHostelId,
                visitorRefId: visitor.refId,
                visitorRefType: visitor.refType,
                purpose,
                status: VISIT_STATUS.CHECKED_IN,
                checkInTime: now,
                expectedExitTime: parsedExpectedExitTime,
                checkedInById: wardenUser.id,
                visitStudents: {
                    create: uniqueStudentIds.map(studentId => ({ studentId }))
                },
                visitTimeline: {
                    create: {
                        action: 'CHECKED_IN',
                        performedById: wardenUser.id,
                        remarks: 'Checked in by Warden'
                    }
                }
            },
            include: {
                hostel: { select: { id: true, name: true } },
                visitStudents: { include: { student: { select: { id: true, name: true } } } },
                visitTimeline: true
            }
        });

        return createdVisit;
    });

    try {
        const studentNames = students.map(s => s.name).join(', ');
        const notificationSender = {
            id: wardenUser.id,
            model: 'User',
            snapshot: { name: wardenUser.name, role: wardenUser.role }
        };

        const parentExcludeIds = visitor.refType === 'Parent' ? [visitor.refId] : [];
        const targets = [
            { type: 'PARENT', filter: { studentIds: uniqueStudentIds, excludeIds: parentExcludeIds } },
            { type: 'STUDENT', filter: { studentIds: uniqueStudentIds } },
            { type: 'MENTOR', filter: { studentIds: uniqueStudentIds } }
        ];

        if (targetHostelWardens.length > 0) {
            targets.push({ type: 'USER', filter: { userIds: targetHostelWardens } });
        }

        await orchestratorService.triggerNotification({
            eventName: 'VISIT_CHECKED_IN',
            target: targets,
            data: {
                personName,
                personType: visitor.refType,
                studentName: studentNames,
                purpose,
                checkInTime: now.toISOString(),
                expectedExitTime: parsedExpectedExitTime.toISOString(),
                link: '/dashboard/visitors/history'
            },
            sender: notificationSender
        });
    } catch (e) {
        console.error('[VisitorService] Failed to publish VISIT_CHECKED_IN event:', e);
    }

    return newVisit;
};

// ============================================================================
// Warden Add Students To Active Visit Service
// ============================================================================

export const addStudentsToVisit = async (visitId, payload, wardenUser) => {
    if (wardenUser.role !== ROLES.WARDEN) {
        throw createError('Unauthorized: Only wardens can manage visits.', 403);
    }

    const { selectedStudentIds, expectedExitTime } = payload;
    const parsedExpectedExitTime = expectedExitTime ? new Date(expectedExitTime) : null;

    const uniqueStudentIds = [...new Set(selectedStudentIds)];
    if (uniqueStudentIds.length !== selectedStudentIds.length) {
        throw createError('Duplicate student IDs provided.', 400);
    }

    const visit = await visitorRepository.findVisitForStudentAddition(visitId);

    if (!visit) {
        throw createError('Visit not found.', 404);
    }

    if (visit.status !== VISIT_STATUS.CHECKED_IN) {
        throw createError('Students can only be added to currently active visits.', 400);
    }

    const existingStudentIds = visit.visitStudents.map(vs => vs.studentId);
    const newStudentIds = uniqueStudentIds.filter(id => !existingStudentIds.includes(id));

    if (newStudentIds.length === 0) {
        throw createError('All selected students are already part of this visit.', 400);
    }

    const targetHostelId = visit.hostelId;
    const hostelWardenIds = visit.hostel.wardens.map(w => w.userId);

    if (!hostelWardenIds.includes(wardenUser.id)) {
        throw createError('Unauthorized: You are not assigned to the hostel for these students.', 403);
    }

    const students = await visitorRepository.findStudentsWithHostels(newStudentIds);

    if (students.length !== newStudentIds.length) {
        throw createError('One or more selected students not found.', 400);
    }

    const targetOrgId = students[0].organizationId;
    for (const student of students) {
        if (!student.studentHostels || student.studentHostels.length === 0) {
            throw createError(`Student ${student.name} does not have an active hostel status.`, 400);
        }
        if (student.studentHostels[0].hostelId !== targetHostelId) {
            throw createError(`Student ${student.name} belongs to a different hostel. Must check-in separately.`, 400);
        }
        if (student.organizationId !== targetOrgId) {
            throw createError(`Student ${student.name} belongs to a different organization.`, 400);
        }
    }

    let personName = 'Visitor';
    if (visit.visitorRefType === 'Parent') {
        const parentDoc = await visitorRepository.findParentById(visit.visitorRefId);
        if (!parentDoc) throw createError('Parent profile no longer exists.', 404);
        if (!parentDoc.isActive) throw createError('Parent profile is inactive.', 400);
        if (!parentDoc.isVerified) throw createError('Parent profile is not verified.', 400);
        personName = parentDoc.parentName || parentDoc.name || 'Parent';
    } else {
        const visitorDoc = await visitorRepository.findVisitorById(visit.visitorRefId);
        if (!visitorDoc) throw createError('Visitor profile no longer exists.', 404);
        if (visitorDoc.status === 'INACTIVE') throw createError('Visitor profile is inactive.', 400);
        if (visitorDoc.status === 'BLACKLISTED') throw createError('Visitor profile is blacklisted.', 400);
        if (visitorDoc.status === 'DELETED') throw createError('Visitor profile is deleted.', 400);
        personName = visitorDoc.name;

        const approvedRequests = await visitorRepository.findApprovedRequestsForVisitor(visit.visitorRefId, newStudentIds);
        for (const sId of newStudentIds) {
            const vr = approvedRequests.find(v => v.studentId === sId);
            if (!vr) {
                throw createError(`VisitRequest for student is not Approved or missing.`, 400);
            }
        }
    }

    const studentNames = students.map(s => s.name).join(', ');

    const updatedVisit = await prisma.$transaction(async (tx) => {
        await tx.visitorVisitStudent.createMany({
            data: newStudentIds.map(studentId => ({
                visitorVisitId: visitId,
                studentId
            }))
        });

        const updateData = {};
        if (parsedExpectedExitTime) {
            updateData.expectedExitTime = parsedExpectedExitTime;
        }

        const visitUpdated = await tx.visitorVisit.update({
            where: { id: visitId },
            data: {
                ...updateData,
                visitTimeline: {
                    create: {
                        action: 'STUDENT_ADDED',
                        performedById: wardenUser.id,
                        remarks: `Added ${studentNames} to the visit.`
                    }
                }
            },
            include: {
                hostel: { select: { id: true, name: true } },
                visitStudents: { include: { student: { select: { id: true, name: true } } } },
                visitTimeline: true
            }
        });

        return visitUpdated;
    });

    try {
        const notificationData = {
            personName,
            personType: visit.visitorRefType,
            studentName: studentNames,
            purpose: visit.purpose,
            link: '/dashboard/visitors/history'
        };

        const notificationSender = {
            id: wardenUser.id,
            model: 'User',
            snapshot: { name: wardenUser.name, role: wardenUser.role }
        };

        const parentExcludeIds = visit.visitorRefType === 'Parent' ? [visit.visitorRefId] : [];

        orchestratorService.triggerNotification({
            eventName: 'VISIT_STUDENT_ADDED',
            target: {
                type: 'PARENT',
                filter: { studentIds: newStudentIds, excludeIds: parentExcludeIds }
            },
            data: notificationData,
            sender: notificationSender
        }).catch(console.error);

        orchestratorService.triggerNotification({
            eventName: 'VISIT_STUDENT_ADDED',
            target: {
                type: 'USER',
                filter: { role: ROLES.STUDENT, userIds: newStudentIds }
            },
            data: notificationData,
            sender: notificationSender
        }).catch(console.error);
    } catch (e) {
        console.error('[VisitorService] Failed to publish VISIT_STUDENT_ADDED event:', e);
    }

    return updatedVisit;
};

// ============================================================================
// Super Admin Hostel Visitor Summary Service
// ============================================================================

export const getSuperAdminHostelVisitors = async (query, user) => {
    if (user.role !== ROLES.SUPER_ADMIN) {
        throw createError('Unauthorized role.', 403);
    }

    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 10));
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const hostels = await visitorRepository.findAllHostelsForSummary(search);

    if (hostels.length === 0) {
        return {
            total: 0,
            page,
            limit,
            totalPages: 0,
            data: []
        };
    }

    const visitRequests = await visitorRepository.findAllVisitRequestsForHostelSummary();

    const hostelStatsMap = new Map();

    for (const vr of visitRequests) {
        const studentHostelId = vr.student?.studentHostels?.[0]?.hostelId;
        if (!studentHostelId) continue;

        if (!hostelStatsMap.has(studentHostelId)) {
            hostelStatsMap.set(studentHostelId, {
                allVisitors: new Set(),
                pendingVisitors: new Set(),
                approvedVisitors: new Set()
            });
        }

        const stats = hostelStatsMap.get(studentHostelId);
        stats.allVisitors.add(vr.visitorId);

        if (vr.status === VISIT_REQUEST_STATUS.PENDING) {
            stats.pendingVisitors.add(vr.visitorId);
        } else if (vr.status === VISIT_REQUEST_STATUS.APPROVED) {
            stats.approvedVisitors.add(vr.visitorId);
        }
    }

    const hostelsWithVisits = hostels.map(h => {
        const stats = hostelStatsMap.get(h.id) || {
            allVisitors: new Set(),
            pendingVisitors: new Set(),
            approvedVisitors: new Set()
        };

        return {
            hostelId: h.id,
            hostelName: h.name || 'Unknown',
            hostelCode: h.code || '',
            totalVisitors: stats.allVisitors.size,
            pendingApprovals: stats.pendingVisitors.size,
            approvedVisitors: stats.approvedVisitors.size
        };
    });

    const total = hostelsWithVisits.length;
    const paginatedData = hostelsWithVisits.slice(skip, skip + limit);

    return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        data: paginatedData
    };
};

// ============================================================================
// Super Admin Visitor Blacklist & Remove Blacklist Services
// ============================================================================

export const blacklistVisitor = async (visitorId, reason, user) => {
    if (user.role !== ROLES.SUPER_ADMIN) {
        throw createError('Unauthorized role.', 403);
    }

    const visitor = await visitorRepository.findVisitorById(visitorId);

    if (!visitor) {
        throw createError('Visitor profile not found.', 404);
    }

    if (visitor.status === VISITOR_STATUS.DELETED) {
        throw createError('Deleted visitors cannot be blacklisted.', 409);
    }

    if (visitor.status === VISITOR_STATUS.BLACKLISTED) {
        throw createError('Visitor is already blacklisted.', 409);
    }

    let cancelledRequestsCount = 0;
    let isInside = false;

    await prisma.$transaction(async (tx) => {
        await tx.visitor.update({
            where: { id: visitorId },
            data: { status: VISITOR_STATUS.BLACKLISTED }
        });

        await tx.visitorChangeLog.create({
            data: {
                visitorId,
                action: VISITOR_CHANGE_LOG_ACTIONS.BLACKLISTED,
                performedById: user.id,
                performedByRole: user.role,
                reason,
                timestamp: new Date()
            }
        });

        const activeRequests = await tx.visitRequest.findMany({
            where: {
                visitorId,
                status: { in: [VISIT_REQUEST_STATUS.PENDING, VISIT_REQUEST_STATUS.APPROVED] }
            },
            select: { id: true }
        });

        if (activeRequests.length > 0) {
            cancelledRequestsCount = activeRequests.length;
            const requestIds = activeRequests.map(r => r.id);

            await tx.visitRequest.updateMany({
                where: { id: { in: requestIds } },
                data: { status: VISIT_REQUEST_STATUS.CANCELLED }
            });

            await tx.visitRequestTimeline.createMany({
                data: requestIds.map(vId => ({
                    visitRequestId: vId,
                    action: 'CANCELLED',
                    performedById: user.id,
                    performedByRole: user.role,
                    remarks: 'Visitor Blacklisted'
                }))
            });
        }

        const activeVisit = await tx.visitorVisit.findFirst({
            where: {
                visitorRefId: visitorId,
                visitorRefType: 'Visitor',
                status: VISIT_STATUS.CHECKED_IN
            }
        });

        isInside = !!activeVisit;
    });

    if (isInside) {
        try {
            await orchestratorService.triggerNotification({
                eventName: 'VISITOR_BLACKLISTED_SECURITY_ALERT',
                target: [
                    { type: 'ROLE', filter: { role: ROLES.WARDEN } }
                ],
                data: {
                    visitorName: visitor.name,
                    phone: visitor.phone,
                    reason,
                    message: "Visitor has been blacklisted by Super Admin while currently inside the hostel. Please take immediate action.",
                    link: '/dashboard/visitors'
                },
                sender: { id: user.id, model: 'User', snapshot: { name: user.name, role: user.role } }
            });
        } catch (err) {
            console.error('[Notification] Failed to send blacklist security alert:', err);
        }
    }

    return {
        visitorId: visitor.id,
        status: VISITOR_STATUS.BLACKLISTED,
        cancelledRequestsCount,
        securityAlertTriggered: isInside
    };
};

export const removeBlacklistVisitor = async (visitorId, user) => {
    if (user.role !== ROLES.SUPER_ADMIN) {
        throw createError('Unauthorized role.', 403);
    }

    const visitor = await visitorRepository.findVisitorById(visitorId);

    if (!visitor) {
        throw createError('Visitor profile not found.', 404);
    }

    if (visitor.status !== VISITOR_STATUS.BLACKLISTED) {
        throw createError('Visitor is not currently blacklisted.', 409);
    }

    const updatedVisitor = await prisma.$transaction(async (tx) => {
        const updated = await tx.visitor.update({
            where: { id: visitorId },
            data: { status: VISITOR_STATUS.INACTIVE }
        });

        await tx.visitorChangeLog.create({
            data: {
                visitorId,
                action: VISITOR_CHANGE_LOG_ACTIONS.BLACKLIST_REMOVED,
                performedById: user.id,
                performedByRole: user.role,
                timestamp: new Date()
            }
        });

        return updated;
    });

    return {
        visitorId: updatedVisitor.id,
        status: updatedVisitor.status
    };
};

// ============================================================================
// Parent Update Visitor Profile Service
// ============================================================================

export const updateVisitorProfile = async (visitorId, payload, user, explicitStudentId = null) => {
    const visitor = await visitorRepository.findVisitorById(visitorId);

    if (!visitor) {
        throw createError('Visitor not found.', 404);
    }

    const linkedStudentIds = await visitorRepository.findParentStudentIds(user.id);

    if (!linkedStudentIds || linkedStudentIds.length === 0) {
        throw createError('Parent is inactive or not linked to any students.', 403);
    }

    let authorizedStudentIds = [];
    if (explicitStudentId) {
        const isAuthorized = linkedStudentIds.includes(explicitStudentId);
        if (!isAuthorized) {
            throw createError('Unauthorized access to this student.', 403);
        }
        authorizedStudentIds = [explicitStudentId];
    } else {
        authorizedStudentIds = linkedStudentIds;
    }

    const activeRequest = await visitorRepository.findVisitRequestByVisitorAndStudents(visitorId, authorizedStudentIds);

    if (!activeRequest) {
        throw createError('Unauthorized: You can only update visitors with whom you have an active visit request.', 403);
    }

    const allowedFields = ['name', 'email', 'address'];
    const updateData = {};

    for (const key of Object.keys(payload)) {
        if (allowedFields.includes(key) && payload[key] !== undefined) {
            if (visitor[key] !== payload[key]) {
                updateData[key] = payload[key];
            }
        }
    }

    if (Object.keys(updateData).length === 0) {
        return {
            visitorId: visitor.id,
            name: visitor.name,
            phone: visitor.phone,
            email: visitor.email,
            address: visitor.address,
            updatedAt: visitor.updatedAt
        };
    }

    const updatedVisitor = await prisma.$transaction(async (tx) => {
        const updated = await tx.visitor.update({
            where: { id: visitorId },
            data: updateData
        });

        await tx.visitorChangeLog.create({
            data: {
                visitorId,
                action: VISITOR_CHANGE_LOG_ACTIONS.UPDATED,
                performedById: user.id,
                performedByRole: ROLES.PARENT,
                timestamp: new Date()
            }
        });

        return updated;
    });

    return {
        visitorId: updatedVisitor.id,
        name: updatedVisitor.name,
        phone: updatedVisitor.phone,
        email: updatedVisitor.email,
        address: updatedVisitor.address,
        updatedAt: updatedVisitor.updatedAt
    };
};
