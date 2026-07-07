import mongoose from 'mongoose';
import Student from '../students/student.model.js';
import Parent from '../parents/parent.model.js';
import Visitor from './visitor.model.js';
import * as visitorRepository from './visitor.repository.js';
import { VISITOR_STATUS, VISITOR_APPROVAL_ACTIONS } from './visitor.constant.js';
import { orchestratorService } from '../notifications/services/orchestrator.service.js';

/**
 * Parent creates a new visitor profile
 * @param {Object} payload 
 * @param {Object} user (Authenticated Parent)
 */
export const createVisitorProfile = async (payload, user) => {
    const {
        students: studentIds,
        name,
        relationship,
        phone,
        email,
        address,
        idProofType,
        idProofNumber
    } = payload;

    // 1. Parent Validation
    const currentParent = await Parent.findById(user.id);
    if (!currentParent) {
        const error = new Error('Parent not found.');
        error.status = 404;
        throw error;
    }
    if (!currentParent.isActive) {
        const error = new Error('Parent is inactive.');
        error.status = 403;
        throw error;
    }
    if (!currentParent.isVerified) {
        const error = new Error('Parent is not verified.');
        error.status = 403;
        throw error;
    }

    // Fetch all parent records matching this parent's phone to collect all authorized students
    const parentDocs = await Parent.find({ phone: currentParent.phone, isActive: true });
    const authorizedStudentIds = parentDocs.map(p => p.studentId.toString());

    // 2. Student Validation
    for (const sId of studentIds) {
        if (!authorizedStudentIds.includes(sId.toString())) {
            const error = new Error(`Unauthorized access to student: ${sId}`);
            error.status = 403;
            throw error;
        }
    }

    const students = await Student.find({ _id: { $in: studentIds } });
    if (students.length !== studentIds.length) {
        const error = new Error('One or more students not found.');
        error.status = 404;
        throw error;
    }

    const organizationId = students[0].organizationId.toString();
    const hostelId = students[0].hostelId ? students[0].hostelId.toString() : null;

    for (const student of students) {
        if (!student.isActive) {
            const error = new Error(`Student ${student.name} is inactive.`);
            error.status = 400;
            throw error;
        }
        if (student.hostelStatus !== 'active' || !student.hostelId) {
            const error = new Error(`Student ${student.name} does not have an active hostel status.`);
            error.status = 400;
            throw error;
        }
        if (student.organizationId.toString() !== organizationId) {
            const error = new Error('All students must belong to the same organization.');
            error.status = 400;
            throw error;
        }
        if (student.hostelId.toString() !== hostelId) {
            const error = new Error('All students must belong to the same hostel.');
            error.status = 400;
            throw error;
        }
    }

    // 3. Duplicate Validation
    const isDuplicate = await visitorRepository.findDuplicateVisitor(organizationId, phone);
    if (isDuplicate) {
        const error = new Error('Visitor already exists with this phone number.');
        error.status = 409;
        throw error;
    }

    // 4. Create Visitor Payload
    const approvalTimeline = [{
        action: VISITOR_APPROVAL_ACTIONS.CREATED,
        performedBy: currentParent._id,
        remarks: 'Visitor registered by Parent',
    }];

    const visitorData = {
        organizationId,
        name,
        relationship,
        phone,
        students: studentIds,
        approvalStatus: VISITOR_STATUS.PENDING,
        approvalTimeline
    };

    if (email) visitorData.email = email;
    if (address) visitorData.address = address;
    if (idProofType) {
        visitorData.idProofType = idProofType;
        visitorData.idProofNumber = idProofNumber;
    }

    const newVisitor = await visitorRepository.createVisitor(visitorData);

    // 5. Publish Notification Event
    try {
        const studentNames = students.map(s => s.name).join(', ');

        await orchestratorService.triggerNotification({
            eventName: 'VISITOR_CREATED',
            target: {
                type: 'USER',
                filter: {
                    hostelId: hostelId,
                    organizationId: organizationId
                }
            },
            data: {
                parentName: currentParent.parentName,
                visitorName: name,
                studentNames: studentNames
            },
            sender: {
                id: currentParent._id,
                model: 'Parent',
                snapshot: {
                    name: currentParent.parentName,
                    role: 'Parent'
                }
            }
        });
    } catch (notificationError) {
        console.error('[VisitorService] Failed to publish VISITOR_CREATED event:', notificationError);
    }

    return newVisitor;
};

/**
 * Builds standard filter and sort stages for Visitor listings
 * @param {Object} query 
 * @returns {Object} { matchStage, sortStage, skip, limit }
 */
const buildListingStages = (query) => {
    const { page = 1, limit = 10, search, status, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const matchStage = {};

    if (status) {
        matchStage.approvalStatus = status;
    }

    if (search) {
        matchStage.$or = [
            { name: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    let actualSortField = sortBy;
    if (sortBy === 'visitorName') actualSortField = 'name';
    if (sortBy === 'status') actualSortField = 'approvalStatus';

    const sortStage = { [actualSortField]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (Number(page) - 1) * Number(limit);

    return { matchStage, sortStage, skip, limit: Number(limit), page: Number(page) };
};

/**
 * Lists visitors for Admin, Super Admin, and Warden
 * @param {Object} query 
 * @param {Object} user 
 */
export const listVisitors = async (query, user) => {
    const { hostel, organization, date } = query;
    const { matchStage, sortStage, skip, limit, page } = buildListingStages(query);

    // 1. Role-Based Filters
    let targetHostelId = null;

    if (user.role === 'super_admin') {
        if (organization) matchStage.organizationId = new mongoose.Types.ObjectId(organization);
        if (hostel) targetHostelId = hostel;
    } else if (user.role === 'admin') {
        matchStage.organizationId = new mongoose.Types.ObjectId(user.organization);
        if (hostel) targetHostelId = hostel;
    } else if (user.role === 'warden') {
        matchStage.organizationId = new mongoose.Types.ObjectId(user.organization);
        targetHostelId = user.hostelId; // Force warden to their hostel
    } else {
        const error = new Error('Unauthorized role to list visitors.');
        error.status = 403;
        throw error;
    }

    // 2. Hostel Filtering logic
    if (targetHostelId) {
        const studentsInHostel = await Student.find({ hostelId: targetHostelId }, '_id').lean();
        const studentIds = studentsInHostel.map(s => s._id);
        if (studentIds.length === 0) {
            return {
                total: 0,
                page,
                limit,
                totalPages: 0,
                data: []
            };
        }
        matchStage.students = { $in: studentIds };
    }

    if (date) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        matchStage.createdAt = { $gte: startDate, $lte: endDate };
    }

    // 3. Repository Call
    const { data, total } = await visitorRepository.getVisitors(matchStage, sortStage, skip, limit);
    const totalPages = Math.ceil(total / limit);

    return { total, page, limit, totalPages, data };
};

/**
 * Lists visitors specifically for the authenticated Parent
 * @param {Object} query 
 * @param {Object} user (Authenticated Parent)
 */
export const listParentVisitors = async (query, user) => {
    // 1. Resolve Parent context
    const currentParent = await Parent.findById(user.id);
    if (!currentParent) {
        const error = new Error('Parent not found.');
        error.status = 404;
        throw error;
    }

    // A parent might have multiple students associated under the same phone number
    const parentDocs = await Parent.find({ phone: currentParent.phone, isActive: true });
    const authorizedStudentIds = parentDocs.map(p => p.studentId);

    if (authorizedStudentIds.length === 0) {
        return {
            total: 0,
            page: Number(query.page || 1),
            limit: Number(query.limit || 10),
            totalPages: 0,
            data: []
        };
    }

    // 2. Build Query
    const { matchStage, sortStage, skip, limit, page } = buildListingStages(query);
    matchStage.students = { $in: authorizedStudentIds };

    // 3. Repository Call
    const { data, total } = await visitorRepository.getVisitors(matchStage, sortStage, skip, limit);
    const totalPages = Math.ceil(total / limit);

    return { total, page, limit, totalPages, data };
};

/**
 * Lists visitors specifically for the authenticated Student
 * @param {Object} query 
 * @param {Object} user (Authenticated Student)
 */
export const listStudentVisitors = async (query, user) => {
    // 1. Build Query
    const { matchStage, sortStage, skip, limit, page } = buildListingStages(query);
    matchStage.students = new mongoose.Types.ObjectId(user.id);

    // 2. Repository Call
    const { data, total } = await visitorRepository.getVisitors(matchStage, sortStage, skip, limit);
    const totalPages = Math.ceil(total / limit);

    return { total, page, limit, totalPages, data };
};

/**
 * Approve a pending visitor
 * @param {String} visitorId 
 * @param {Object} adminUser 
 */
export const approveVisitor = async (visitorId, adminUser) => {
    // 1. Fetch Visitor
    const visitor = await visitorRepository.findVisitorById(visitorId);
    if (!visitor) {
        const error = new Error('Visitor not found.');
        error.status = 404;
        throw error;
    }

    // 2. Authorization
    if (adminUser.role === 'admin') {
        if (visitor.organizationId.toString() !== adminUser.organization.toString()) {
            const error = new Error('Unauthorized to approve visitors outside your organization.');
            error.status = 403;
            throw error;
        }
    } else if (adminUser.role !== 'super_admin') {
        const error = new Error('Unauthorized role.');
        error.status = 403;
        throw error;
    }

    // 3. Business Logic
    if (visitor.approvalStatus === VISITOR_STATUS.APPROVED) {
        const error = new Error('Visitor is already approved.');
        error.status = 400;
        throw error;
    }
    if (visitor.approvalStatus === VISITOR_STATUS.REJECTED) {
        const error = new Error('Visitor is rejected and cannot be approved.');
        error.status = 400;
        throw error;
    }
    if (visitor.approvalStatus === VISITOR_STATUS.INACTIVE) {
        const error = new Error('Visitor is inactive.');
        error.status = 400;
        throw error;
    }

    // 4. Update Database
    const updateData = {
        approvalStatus: VISITOR_STATUS.APPROVED,
        $unset: { rejectionReason: 1 }
    };

    const timelineEntry = {
        action: VISITOR_APPROVAL_ACTIONS.APPROVED,
        performedBy: adminUser.id,
        remarks: 'Approved by Admin'
    };

    const updatedVisitor = await visitorRepository.updateVisitorStatus(visitorId, updateData, timelineEntry);

    // 5. Notification
    try {
        const students = await Student.find({ _id: { $in: visitor.students } }, 'name');
        const studentNames = students.map(s => s.name).join(', ');

        await orchestratorService.triggerNotification({
            eventName: 'VISITOR_APPROVED',
            target: {
                type: 'PARENT',
                filter: {
                    studentIds: visitor.students.map(id => id.toString())
                }
            },
            data: {
                visitorName: visitor.name,
                studentNames: studentNames
            },
            sender: {
                id: adminUser.id,
                model: 'User',
                snapshot: {
                    name: adminUser.name,
                    role: adminUser.role
                }
            }
        });
    } catch (notificationError) {
        console.error('[VisitorService] Failed to publish VISITOR_APPROVED event:', notificationError);
    }

    // 6. Return sanitized DTO
    return {
        visitorId: updatedVisitor._id,
        visitorName: updatedVisitor.name,
        status: updatedVisitor.approvalStatus,
        approvedAt: new Date(),
        approvedBy: adminUser.id
    };
};

/**
 * Reject a pending visitor
 * @param {String} visitorId 
 * @param {String} reason 
 * @param {Object} adminUser 
 */
export const rejectVisitor = async (visitorId, reason, adminUser) => {
    // 1. Fetch Visitor
    const visitor = await visitorRepository.findVisitorById(visitorId);
    if (!visitor) {
        const error = new Error('Visitor not found.');
        error.status = 404;
        throw error;
    }

    // 2. Authorization
    if (adminUser.role === 'admin') {
        if (visitor.organizationId.toString() !== adminUser.organization.toString()) {
            const error = new Error('Unauthorized to reject visitors outside your organization.');
            error.status = 403;
            throw error;
        }
    } else if (adminUser.role !== 'super_admin') {
        const error = new Error('Unauthorized role.');
        error.status = 403;
        throw error;
    }

    // 3. Business Logic
    if (visitor.approvalStatus === VISITOR_STATUS.APPROVED) {
        const error = new Error('Visitor is already approved and cannot be rejected.');
        error.status = 400;
        throw error;
    }
    if (visitor.approvalStatus === VISITOR_STATUS.REJECTED) {
        const error = new Error('Visitor is already rejected.');
        error.status = 400;
        throw error;
    }
    if (visitor.approvalStatus === VISITOR_STATUS.INACTIVE) {
        const error = new Error('Visitor is inactive.');
        error.status = 400;
        throw error;
    }

    // 4. Update Database
    const updateData = {
        approvalStatus: VISITOR_STATUS.REJECTED,
        rejectionReason: reason
    };

    const timelineEntry = {
        action: VISITOR_APPROVAL_ACTIONS.REJECTED,
        performedBy: adminUser.id,
        remarks: reason
    };

    const updatedVisitor = await visitorRepository.updateVisitorStatus(visitorId, updateData, timelineEntry);

    // 5. Notification
    try {
        await orchestratorService.triggerNotification({
            eventName: 'VISITOR_REJECTED',
            target: {
                type: 'PARENT',
                filter: {
                    studentIds: visitor.students.map(id => id.toString())
                }
            },
            data: {
                visitorName: visitor.name,
                reason: reason
            },
            sender: {
                id: adminUser.id,
                model: 'User',
                snapshot: {
                    name: adminUser.name,
                    role: adminUser.role
                }
            }
        });
    } catch (notificationError) {
        console.error('[VisitorService] Failed to publish VISITOR_REJECTED event:', notificationError);
    }

    // 6. Return sanitized DTO
    return {
        visitorId: updatedVisitor._id,
        visitorName: updatedVisitor.name,
        status: updatedVisitor.approvalStatus,
        rejectedAt: new Date(),
        rejectionReason: updatedVisitor.rejectionReason
    };
};

/**
 * Returns role-based dashboard summary cards for Visitor management
 * @param {Object} user 
 */
export const getDashboardSummary = async (user) => {
    let context = {};
    let role = user.role;
    
    // Resolve scope based on role
    switch (role) {
        case 'super_admin':
            break;
        case 'admin':
            context.organizationId = new mongoose.Types.ObjectId(user.organization);
            break;
        case 'warden':
            context.hostelId = new mongoose.Types.ObjectId(user.hostelId);
            break;
        case 'parent':
            const currentParent = await Parent.findById(user.id);
            if (!currentParent) throw Object.assign(new Error('Parent not found.'), { status: 404 });
            
            const parentDocs = await Parent.find({ phone: currentParent.phone, isActive: true });
            context.studentIds = parentDocs.map(p => new mongoose.Types.ObjectId(p.studentId));
            
            if (context.studentIds.length === 0) {
                // If parent has no active students, return early with 0 counts
                return {
                    cards: [
                        { key: "my_visitors", title: "My Visitors", value: 0 },
                        { key: "pending", title: "Pending Approval", value: 0 },
                        { key: "approved", title: "Approved Visitors", value: 0 },
                        { key: "rejected", title: "Rejected Visitors", value: 0 }
                    ]
                };
            }
            break;
        case 'student':
            context.studentId = new mongoose.Types.ObjectId(user.id);
            // Pre-fetch assigned visitor IDs for VisitorVisit counts
            const visitorsAssigned = await Visitor.find({ students: context.studentId }, '_id').lean();
            context.visitorIds = visitorsAssigned.map(v => v._id);
            break;
        default:
            throw Object.assign(new Error('Unauthorized role.'), { status: 403 });
    }

    const stats = await visitorRepository.getDashboardStats(role, context);
    
    // Build the DTO array based on role
    const cards = [];

    switch (role) {
        case 'super_admin':
            cards.push(
                { key: "total_visitors", title: "Total Visitors", value: stats.totalVisitors },
                { key: "pending", title: "Pending Approval", value: stats.pendingApproval },
                { key: "visitors_inside", title: "Visitors Inside", value: stats.visitorsInside },
                { key: "todays_visits", title: "Today's Visits", value: stats.todaysVisits }
            );
            break;
        case 'admin':
            cards.push(
                { key: "pending", title: "Pending Approval", value: stats.pendingApproval },
                { key: "approved", title: "Approved Visitors", value: stats.approvedVisitors },
                { key: "visitors_inside", title: "Visitors Inside", value: stats.visitorsInside },
                { key: "todays_visits", title: "Today's Visits", value: stats.todaysVisits }
            );
            break;
        case 'warden':
            cards.push(
                { key: "visitors_inside", title: "Visitors Inside", value: stats.visitorsInside },
                { key: "todays_check_ins", title: "Today's Check-Ins", value: stats.todaysCheckIns },
                { key: "todays_check_outs", title: "Today's Check-Outs", value: stats.todaysCheckOuts },
                { key: "overstayed", title: "Overstayed Visitors", value: stats.overstayedVisitors }
            );
            break;
        case 'parent':
            cards.push(
                { key: "my_visitors", title: "My Visitors", value: stats.myVisitors },
                { key: "pending", title: "Pending Approval", value: stats.pendingApproval },
                { key: "approved", title: "Approved Visitors", value: stats.approvedVisitors },
                { key: "rejected", title: "Rejected Visitors", value: stats.rejectedVisitors }
            );
            break;
        case 'student':
            cards.push(
                { key: "my_approved_visitors", title: "My Approved Visitors", value: stats.myApprovedVisitors },
                { key: "pending", title: "Pending Visitors", value: stats.pendingVisitors },
                { key: "todays_visits", title: "Today's Visits", value: stats.todaysVisits },
                { key: "total_visitors", title: "Total Visitors", value: stats.totalVisitors }
            );
            break;
    }

    return { cards };
};
