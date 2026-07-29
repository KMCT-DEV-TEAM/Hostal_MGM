import mongoose from 'mongoose';
import Student from '../students/student.model.js';
import Parent from '../parents/parent.model.js';
import Visitor from './visitor.model.js';
import MentorAssignment from '../mentors/mentorAssignment.model.js';
import StudentParent from '../parents/studentParent.model.js';
import * as visitorRepository from './visitor.repository.js';
import {
    VISITOR_STATUS,
    VISITOR_APPROVAL_ACTIONS,
    VISITOR_VISIT_STATUS,
    VISITOR_VISIT_TIMELINE_ACTIONS
} from './visitor.constant.js';
import { orchestratorService } from '../notifications/services/orchestrator.service.js';

/**
 * Parent creates a new visitor profile
 * @param {Object} payload 
 * @param {Object} user (Authenticated Parent)
 */
export const createVisitorProfile = async (payload, user, explicitStudentId = null) => {
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

    const currentParent = await Parent.findById(user.id);
    if (!currentParent) {
        const error = new Error('Parent not found.');
        error.status = 404;
        throw error;
    }
    if (!currentParent.isActive || !currentParent.isVerified) {
        const error = new Error('Parent is inactive or not verified.');
        error.status = 403;
        throw error;
    }

    let authorizedStudentIds = [];
    const studentParentLinks = await StudentParent.find({ parentId: user.id, status: 'active' });
    if (!studentParentLinks || studentParentLinks.length === 0) {
        const error = new Error('Parent is inactive or not linked to any students.');
        error.status = 403;
        throw error;
    }

    // We allow the parent to select ANY of their linked students (siblings).
    authorizedStudentIds = studentParentLinks.map(link => link.studentId.toString());

    if (explicitStudentId && !authorizedStudentIds.includes(explicitStudentId)) {
        const error = new Error('Unauthorized access to the explicit student context.');
        error.status = 403;
        throw error;
    }

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
            target: [
                {
                    type: 'USER',
                    filter: {
                        hostelId: hostelId,
                        organizationId: organizationId
                    }
                },
                {
                    type: 'MENTOR',
                    filter: {
                        studentIds: studentIds
                    }
                }
            ],
            data: {
                parentName: currentParent.parentName,
                visitorName: name,
                studentNames: studentNames,
                link: '/dashboard/visitors'
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
 * Update visitor status (by parent or admin)
 * @param {String} visitorId 
 * @param {String} status 
 * @param {Object} user 
 */
export const updateVisitorStatus = async (visitorId, status, user, explicitStudentId = null) => {
    // 1. Fetch Visitor
    const visitor = await visitorRepository.findVisitorById(visitorId);
    if (!visitor) {
        const error = new Error('Visitor not found.');
        error.status = 404;
        throw error;
    }

    // 2. Authorization
    if (user.role === 'parent' || user.explicitStudentId) {
        if (!['Pending', 'Inactive'].includes(status)) {
            const error = new Error('Parents can only change status to Pending or Inactive.');
            error.status = 403;
            throw error;
        }

        let parentStudentIds = [];
        const studentParentLinks = await StudentParent.find({ parentId: user.id, status: 'active' });

        if (explicitStudentId) {
            const isAuthorized = studentParentLinks.some(link => link.studentId.toString() === explicitStudentId);
            if (!isAuthorized) {
                const error = new Error('Unauthorized access to this student.');
                error.status = 403;
                throw error;
            }
            parentStudentIds = [explicitStudentId];
        } else {
            parentStudentIds = studentParentLinks.map(link => link.studentId.toString());
            if (parentStudentIds.length === 0) {
                const error = new Error('No linked students found.');
                error.status = 403;
                throw error;
            }
        }

        const visitorStudentIds = visitor.students.map(s => s.toString());
        const hasOverlap = visitorStudentIds.some(id => parentStudentIds.includes(id));
        if (!hasOverlap) {
            const error = new Error('Unauthorized to update this visitor.');
            error.status = 403;
            throw error;
        }
    } else if (user.role === 'admin' || user.role === 'super_admin') {
        if (!['Inactive', 'Approved', 'Rejected'].includes(status)) {
            const error = new Error('Admins can only change status to Inactive, Approved, or Rejected.');
            error.status = 403;
            throw error;
        }
    } else if (user.role === 'mentor') {
        if (!['Inactive', 'Approved', 'Rejected', 'Pending'].includes(status)) {
            const error = new Error('Mentors can only change status to Inactive, Approved, Pending, or Rejected.');
            error.status = 403;
            throw error;
        }

        const activeAssignments = await MentorAssignment.find({
            mentorId: user.id || user._id,
            status: "active"
        }, "batchId").lean();
        const batchIds = activeAssignments.map(a => a.batchId);
        const mentorStudents = await Student.find({ batchId: { $in: batchIds } }, "_id").lean();
        const mentorStudentIds = mentorStudents.map(s => s._id.toString());
        const visitorStudentIds = visitor.students.map(s => s.toString());

        const hasOverlap = visitorStudentIds.some(id => mentorStudentIds.includes(id));
        if (!hasOverlap) {
            const error = new Error('Unauthorized to update this visitor.');
            error.status = 403;
            throw error;
        }
    } else {
        const error = new Error('Unauthorized role to update visitor status.');
        error.status = 403;
        throw error;
    }

    // 3. Business Logic
    if (visitor.approvalStatus === status) {
        const error = new Error(`Visitor is already ${status}.`);
        error.status = 400;
        throw error;
    }

    // 4. Update Database
    const updateData = {
        approvalStatus: status
    };

    let actionName = 'Status Updated';
    if (status === VISITOR_STATUS.INACTIVE) actionName = VISITOR_APPROVAL_ACTIONS.DEACTIVATED || 'Deactivated';
    else if (status === VISITOR_STATUS.APPROVED || status === VISITOR_STATUS.PENDING) actionName = VISITOR_APPROVAL_ACTIONS.ACTIVATED || 'Activated';

    const roleName = user.role === 'parent' ? 'parent' : (user.role === 'mentor' ? 'mentor' : (user.role === 'super_admin' ? 'super admin' : 'admin'));

    const timelineEntry = {
        action: actionName,
        performedBy: user.id,
        remarks: `Status changed to ${status} by ${roleName}.`
    };

    const updatedVisitor = await visitorRepository.updateVisitorStatus(

        visitorId,
        updateData,
        timelineEntry
    );

    return updatedVisitor;
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

    const sortStage = { priority: 1, [actualSortField]: sortOrder === 'asc' ? 1 : -1 };
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
        const Hostel = mongoose.model('Hostel');
        const wardenHostel = await Hostel.findOne({ wardens: user.id }, '_id');
        if (!wardenHostel) {
            const error = new Error('Unauthorized: You are not assigned to any hostel.');
            error.status = 403;
            throw error;
        }
        targetHostelId = wardenHostel._id; // Force warden to their hostel
    } else if (user.role === 'mentor') {
        const activeAssignments = await MentorAssignment.find({
            mentorId: user.id || user._id,
            status: "active"
        }, "batchId").lean();
        const batchIds = activeAssignments.map(a => a.batchId);
        if (batchIds.length === 0) {
            return {
                total: 0,
                page,
                limit,
                totalPages: 0,
                data: []
            };
        }
        let studentQuery = { batchId: { $in: batchIds } };
        if (hostel) {
            studentQuery.hostelId = hostel;
        }
        const studentsInBatches = await Student.find(studentQuery, "_id").lean();
        const studentIds = studentsInBatches.map(s => s._id);
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
export const listParentVisitors = async (query, user, explicitStudentId = null) => {
    let authorizedStudentIds = [];

    // 1. Resolve Parent context
    const studentParentLinks = await StudentParent.find({ parentId: user.id, status: 'active' });
    if (!studentParentLinks || studentParentLinks.length === 0) {
        return { total: 0, page: Number(query.page || 1), limit: Number(query.limit || 10), totalPages: 0, data: [] };
    }

    if (explicitStudentId) {
        const isAuthorized = studentParentLinks.some(link => link.studentId.toString() === explicitStudentId);
        if (!isAuthorized) {
            const error = new Error('Unauthorized access to this student.');
            error.status = 403;
            throw error;
        }
        authorizedStudentIds = [explicitStudentId];
    } else {
        authorizedStudentIds = studentParentLinks.map(link => link.studentId.toString());
    }

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
    matchStage.students = { $in: authorizedStudentIds.map(id => new mongoose.Types.ObjectId(id)) };

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
 * Gets a visitor details with strict role-based authorization and data masking
 * @param {String} visitorId 
 * @param {Object} user 
 */
export const getVisitorDetails = async (visitorId, user, explicitStudentId = null) => {
    const visitor = await visitorRepository.getVisitorDetails(visitorId);

    if (!visitor) {
        const error = new Error('Visitor not found.');
        error.status = 404;
        throw error;
    }

    // 1. Role-Based Authorization
    const visitorStudentIds = visitor.students.map(s => s._id.toString());
    const visitorHostelId = visitor.students.length > 0 ? visitor.students[0].hostelId.toString() : null;

    if (user.role === 'admin') {
        if (visitor.organizationId._id.toString() !== user.organization.toString()) {
            throw Object.assign(new Error('Unauthorized: Organization mismatch.'), { status: 403 });
        }
    } else if (user.role === 'warden') {
        const Hostel = mongoose.model('Hostel');
        const wardenHostel = await Hostel.findOne({ wardens: user.id }, '_id');
        if (!wardenHostel) {
            throw Object.assign(new Error('Unauthorized: Not assigned to any hostel.'), { status: 403 });
        }
        if (visitorHostelId !== wardenHostel._id.toString()) {
            throw Object.assign(new Error('Unauthorized: Hostel mismatch.'), { status: 403 });
        }
    } else if (user.role === 'student') {
        if (!visitorStudentIds.includes(user.id)) {
            throw Object.assign(new Error('Unauthorized: Visitor not assigned to this student.'), { status: 403 });
        }
    } else if (user.role === 'parent' || user.explicitStudentId) {
        let authorizedStudentIds = [];
        const studentParentLinks = await StudentParent.find({ parentId: user.id, status: 'active' });

        if (explicitStudentId) {
            const isAuthorized = studentParentLinks.some(link => link.studentId.toString() === explicitStudentId);
            if (!isAuthorized) {
                throw Object.assign(new Error('Unauthorized access to this student.'), { status: 403 });
            }
            authorizedStudentIds = [explicitStudentId];
        } else {
            authorizedStudentIds = studentParentLinks.map(link => link.studentId.toString());
        }

        const hasOverlap = visitorStudentIds.some(id => authorizedStudentIds.includes(id));
        if (!hasOverlap) {
            throw Object.assign(new Error('Unauthorized: Visitor not linked to your students.'), { status: 403 });
        }
    } else if (user.role === 'mentor') {
        const activeAssignments = await MentorAssignment.find({
            mentorId: user.id || user._id,
            status: "active"
        }, "batchId").lean();
        const batchIds = activeAssignments.map(a => a.batchId);

        const mentorStudents = await Student.find({ batchId: { $in: batchIds } }, "_id").lean();
        const mentorStudentIds = mentorStudents.map(s => s._id.toString());

        const hasOverlap = visitorStudentIds.some(id => mentorStudentIds.includes(id));
        if (!hasOverlap) {
            throw Object.assign(new Error('Unauthorized: Visitor not linked to your assigned batches.'), { status: 403 });
        }
    }

    // 2. Field-Level Security (ID Proof Masking)
    let maskedIdProofNumber = visitor.idProofNumber;
    if (visitor.idProofNumber) {
        const isSuperAdminOrAdmin = ['super_admin', 'admin'].includes(user.role);

        let isCreator = false;
        if (user.role === 'parent' && visitor.approvalTimeline && visitor.approvalTimeline.length > 0) {
            // Find creation event
            const creationEvent = visitor.approvalTimeline.find(t => t.action === VISITOR_APPROVAL_ACTIONS.CREATED);
            if (creationEvent && creationEvent.performedBy && creationEvent.performedBy._id.toString() === user.id) {
                isCreator = true;
            }
        }

        if (!isSuperAdminOrAdmin && !isCreator) {
            // Mask all but last 4 characters
            const num = visitor.idProofNumber;
            if (num.length > 4) {
                maskedIdProofNumber = '*'.repeat(num.length - 4) + num.slice(-4);
            } else {
                maskedIdProofNumber = '****'; // Fallback for very short numbers
            }
        }
    }

    // 3. Process Timeline & DTO Transformation
    let approvedBy = null;
    let approvedAt = null;
    let rejectedBy = null;
    let rejectedAt = null;
    let rejectionReason = null;

    // Sort timeline newest first
    const sortedTimeline = (visitor.approvalTimeline || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const formattedTimeline = sortedTimeline.map(t => {
        if (t.action === VISITOR_APPROVAL_ACTIONS.APPROVED) {
            approvedBy = t.performedBy ? { id: t.performedBy._id, name: t.performedBy.name } : null;
            approvedAt = t.createdAt;
        } else if (t.action === VISITOR_APPROVAL_ACTIONS.REJECTED) {
            rejectedBy = t.performedBy ? { id: t.performedBy._id, name: t.performedBy.name } : null;
            rejectedAt = t.createdAt;
            rejectionReason = t.remarks;
        }

        return {
            action: t.action,
            performedBy: t.performedBy ? t.performedBy.name : 'System',
            role: t.performedBy ? t.performedBy.role : 'System',
            remarks: t.remarks,
            createdAt: t.createdAt
        };
    });

    const formattedStudents = visitor.students.map(s => ({
        id: s._id,
        name: s.name,
        roomNumber: s.roomNumber
    }));

    return {
        visitorId: visitor._id,
        visitorName: visitor.name,
        phone: visitor.phone,
        email: visitor.email,
        relationship: visitor.relationship,
        address: visitor.address,
        idProofType: visitor.idProofType,
        idProofNumber: maskedIdProofNumber,
        students: formattedStudents,
        organization: visitor.organizationId ? {
            id: visitor.organizationId._id,
            name: visitor.organizationId.name
        } : null,
        status: visitor.approvalStatus,
        approvedBy,
        approvedAt,
        rejectedBy,
        rejectedAt,
        rejectionReason,
        createdAt: visitor.createdAt,
        updatedAt: visitor.updatedAt,
        timeline: formattedTimeline
    };
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
    } else if (adminUser.role === 'mentor') {
        const activeAssignments = await MentorAssignment.find({
            mentorId: adminUser.id || adminUser._id,
            status: "active"
        }, "batchId").lean();
        const batchIds = activeAssignments.map(a => a.batchId);
        const mentorStudents = await Student.find({ batchId: { $in: batchIds } }, "_id").lean();
        const mentorStudentIds = mentorStudents.map(s => s._id.toString());
        const visitorStudentIds = visitor.students.map(s => s.toString());

        const hasOverlap = visitorStudentIds.some(id => mentorStudentIds.includes(id));
        if (!hasOverlap) {
            const error = new Error('Unauthorized to approve visitors outside your assigned batches.');
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
        remarks: adminUser.role === 'mentor' ? 'Approved by Mentor' : 'Approved by Admin'
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
                studentNames: studentNames,
                link: '/dashboard/visitors'
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
    } else if (adminUser.role === 'mentor') {
        const activeAssignments = await MentorAssignment.find({
            mentorId: adminUser.id || adminUser._id,
            status: "active"
        }, "batchId").lean();
        const batchIds = activeAssignments.map(a => a.batchId);
        const mentorStudents = await Student.find({ batchId: { $in: batchIds } }, "_id").lean();
        const mentorStudentIds = mentorStudents.map(s => s._id.toString());
        const visitorStudentIds = visitor.students.map(s => s.toString());

        const hasOverlap = visitorStudentIds.some(id => mentorStudentIds.includes(id));
        if (!hasOverlap) {
            const error = new Error('Unauthorized to reject visitors outside your assigned batches.');
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
                reason: reason,
                link: '/dashboard/visitors'
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
            const HostelModel = mongoose.model('Hostel');
            const wardenHostelDoc = await HostelModel.findOne({ wardens: user.id }, '_id');
            if (!wardenHostelDoc) throw Object.assign(new Error('Unauthorized: Not assigned to any hostel.'), { status: 403 });
            context.hostelId = wardenHostelDoc._id;
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

/**
 * Check-in an approved visitor
 * @param {Object} payload 
 * @param {Object} wardenUser 
 */
export const checkInVisitor = async (payload, wardenUser) => {
    const { visitor, purpose, expectedExitTime } = payload;

    // 1. Role Verification (Redundant safety check)
    if (wardenUser.role !== 'warden') {
        const error = new Error('Unauthorized: Only wardens can check-in visitors.');
        error.status = 403;
        throw error;
    }

    // 2. Resolve Person (Parent or Visitor)
    let resolvedPerson = null;
    let studentIds = [];
    let organizationId = null;
    let personName = '';

    if (visitor.refType === 'Parent') {
        const Parent = mongoose.model('Parent');
        resolvedPerson = await Parent.findById(visitor.refId);
        if (!resolvedPerson) {
            const error = new Error('Parent not found.');
            error.status = 404;
            throw error;
        }
        if (!resolvedPerson.isActive) {
            const error = new Error('Parent profile is inactive.');
            error.status = 400;
            throw error;
        }
        if (!resolvedPerson.isVerified) {
            const error = new Error('Parent profile is not verified.');
            error.status = 400;
            throw error;
        }
        studentIds = [resolvedPerson.studentId];
        personName = resolvedPerson.parentName;
    } else if (visitor.refType === 'Visitor') {
        const Visitor = mongoose.model('Visitor');
        resolvedPerson = await Visitor.findById(visitor.refId);
        if (!resolvedPerson) {
            const error = new Error('Visitor not found.');
            error.status = 404;
            throw error;
        }
        if (resolvedPerson.approvalStatus === VISITOR_STATUS.PENDING) {
            const error = new Error('Visitor is pending approval.');
            error.status = 400;
            throw error;
        }
        if (resolvedPerson.approvalStatus === VISITOR_STATUS.REJECTED) {
            const error = new Error('Visitor is rejected.');
            error.status = 400;
            throw error;
        }
        if (resolvedPerson.approvalStatus === VISITOR_STATUS.INACTIVE) {
            const error = new Error('Visitor profile is inactive.');
            error.status = 400;
            throw error;
        }
        studentIds = resolvedPerson.students;
        organizationId = resolvedPerson.organizationId;
        personName = resolvedPerson.name;
    } else {
        const error = new Error('Invalid visitor refType.');
        error.status = 400;
        throw error;
    }

    // 3. Student & Hostel Validation
    const Student = mongoose.model('Student');
    const students = await Student.find({ _id: { $in: studentIds } });
    if (students.length === 0) {
        const error = new Error('No students linked to this person.');
        error.status = 400;
        throw error;
    }

    if (!organizationId) {
        organizationId = students[0].organization; // Wait, Student model organization field is 'organization'
    }

    const targetHostelId = students[0].hostelId;
    if (!targetHostelId) {
        const error = new Error('Student does not have an active hostel.');
        error.status = 400;
        throw error;
    }

    const Hostel = mongoose.model('Hostel');
    const targetHostel = await Hostel.findById(targetHostelId);
    if (!targetHostel || !targetHostel.wardens.some(id => id.toString() === wardenUser.id)) {
        const error = new Error('Unauthorized: You are not assigned to the hostel for these students.');
        error.status = 403;
        throw error;
    }

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
        if (student.hostelId.toString() !== targetHostelId.toString()) {
            const error = new Error(`Student ${student.name} does not belong to the same hostel.`);
            error.status = 400;
            throw error;
        }
    }

    // 4. Duplicate Visit Check
    const activeVisit = await visitorRepository.findActiveVisit(visitor.refId, visitor.refType);
    if (activeVisit) {
        const error = new Error(`${visitor.refType} is already checked in.`);
        error.status = 409;
        throw error;
    }

    // 5. Construct Visit Data
    const now = new Date();
    const parsedExpectedExitTime = new Date(expectedExitTime);

    const visitData = {
        organizationId: organizationId,
        hostelId: targetHostelId,
        visitor: {
            refId: visitor.refId,
            refType: visitor.refType
        },
        students: studentIds, // array of ObjectIds
        purpose: purpose,
        status: VISITOR_VISIT_STATUS.CHECKED_IN,
        checkInTime: now,
        expectedExitTime: parsedExpectedExitTime,
        checkedInBy: wardenUser.id,
        visitTimeline: [{
            action: VISITOR_VISIT_TIMELINE_ACTIONS.CHECKED_IN,
            performedBy: wardenUser.id,
            remarks: 'Checked in by Warden'
        }]
    };

    // 6. Create Visit
    const newVisit = await visitorRepository.createVisit(visitData);

    // 7. Fire Notification
    try {
        const studentNames = students.map(s => s.name).join(', ');

        const notificationData = {
            personName: personName,
            personType: visitor.refType,
            studentName: studentNames,
            purpose: purpose,
            checkInTime: now.toISOString(),
            expectedExitTime: parsedExpectedExitTime.toISOString(),
            link: '/dashboard/visitors/history'
        };

        const notificationSender = {
            id: wardenUser.id,
            model: 'User',
            snapshot: {
                name: wardenUser.name,
                role: wardenUser.role
            }
        };

        // Notify parents linked to the student
        const parentExcludeIds = visitor.refType === 'Parent' ? [visitor.refId.toString()] : [];

        await orchestratorService.triggerNotification({
            eventName: 'VISIT_CHECKED_IN',
            target: {
                type: 'PARENT',
                filter: {
                    studentIds: studentIds.map(id => id.toString()),
                    excludeIds: parentExcludeIds
                }
            },
            data: notificationData,
            sender: notificationSender
        });

        // Also notify students
        await orchestratorService.triggerNotification({
            eventName: 'VISIT_CHECKED_IN',
            target: {
                type: 'USER',
                filter: {
                    role: 'student',
                    userIds: studentIds.map(id => id.toString())
                }
            },
            data: notificationData,
            sender: notificationSender
        });
    } catch (notificationError) {
        console.error('[VisitorService] Failed to publish VISIT_CHECKED_IN event:', notificationError);
    }

    // 8. Return Response DTO
    return {
        visitId: newVisit._id,
        personName: personName,
        personType: visitor.refType,
        studentName: students.map(s => s.name).join(', '),
        purpose: newVisit.purpose,
        checkInTime: newVisit.checkInTime,
        expectedExitTime: newVisit.expectedExitTime,
        status: newVisit.status
    };
};

/**
 * Gets hostel-wise visit summary for Super Admin
 * @param {Object} query 
 * @param {Object} user 
 */
export const getSuperAdminHostelVisits = async (query, user) => {
    if (user.role !== 'super_admin') {
        const error = new Error('Unauthorized role.');
        error.status = 403;
        throw error;
    }

    const { page = 1, limit = 10, search } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const sortStage = { hostelName: 1 };

    const matchStage = {}; // Super Admin sees all

    const searchMatchStage = {};
    if (search) {
        searchMatchStage['hostelName'] = { $regex: search, $options: 'i' };
    }

    const { data, total } = await visitorRepository.getSuperAdminHostelVisitSummaryAggregated(
        matchStage,
        searchMatchStage,
        skip,
        Number(limit),
        sortStage
    );

    const totalPages = Math.ceil(total / Number(limit));

    return { total, page: Number(page), limit: Number(limit), totalPages, data };
};

/**
 * Gets hostel-wise visitor summary for Super Admin
 * @param {Object} query 
 * @param {Object} user 
 */
export const getSuperAdminHostelVisitors = async (query, user) => {
    if (user.role !== 'super_admin') {
        const error = new Error('Unauthorized role.');
        error.status = 403;
        throw error;
    }

    const { page = 1, limit = 10, search } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const sortStage = { hostelName: 1 };

    const matchStage = {}; // Super Admin sees all

    const searchMatchStage = {};
    if (search) {
        searchMatchStage['hostelName'] = { $regex: search, $options: 'i' };
    }

    const { data, total } = await visitorRepository.getSuperAdminHostelVisitorSummaryAggregated(
        matchStage,
        searchMatchStage,
        skip,
        Number(limit),
        sortStage
    );

    const totalPages = Math.ceil(total / Number(limit));

    return { total, page: Number(page), limit: Number(limit), totalPages, data };
};

/**
 * Lists visits for Super Admin, Admin, and Warden
 * @param {Object} query 
 * @param {Object} user 
 */
export const listVisitorVisits = async (query, user) => {
    const { page = 1, limit = 10, search, status, startDate, endDate, hostel, sortBy = 'checkInTime', sortOrder = 'desc' } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const matchStage = {};
    let targetHostelId = null;

    // 1. Role-Based Filters
    if (user.role === 'super_admin') {
        if (!hostel) {
            const error = new Error('hostelId is required for Super Admin.');
            error.status = 400;
            throw error;
        }
        targetHostelId = hostel;
    } else if (user.role === 'admin') {
        matchStage.organizationId = new mongoose.Types.ObjectId(user.organization);
        if (hostel) targetHostelId = hostel;
    } else if (user.role === 'warden') {
        const Hostel = mongoose.model('Hostel');
        const wardenHostel = await Hostel.findOne({ wardens: user.id }, '_id');
        if (!wardenHostel) {
            const error = new Error('Unauthorized: You are not assigned to any hostel.');
            error.status = 403;
            throw error;
        }
        targetHostelId = wardenHostel._id.toString(); // Force warden to their hostel


    } else if (user.role === 'parent') {
        const currentParent = await Parent.findById(user.id);
        if (!currentParent) {
            const error = new Error('Parent not found.');
            error.status = 404;
            throw error;
        }
        const parentDocs = await Parent.find({ phone: currentParent.phone, isActive: true });
        const authorizedStudentIds = parentDocs.map(p => p.studentId);

        if (authorizedStudentIds.length === 0) {
            return { total: 0, page: Number(page), limit: Number(limit), totalPages: 0, data: [] };
        }
        matchStage.students = { $in: authorizedStudentIds };

    } else if (user.role === 'student') {
        matchStage.students = new mongoose.Types.ObjectId(user.id);
    } else {
        const error = new Error('Unauthorized role to list visitor visits.');
        error.status = 403;
        throw error;
    }

    if (targetHostelId) {
        matchStage.hostelId = new mongoose.Types.ObjectId(targetHostelId);
    }


    if (status) {
        matchStage.status = status;
    }

    if (startDate || endDate) {
        matchStage.checkInTime = {};
        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            matchStage.checkInTime.$gte = start;
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            matchStage.checkInTime.$lte = end;
        }
    }

    const searchMatchStage = {};
    if (search) {
        searchMatchStage.$or = [
            { visitorName: { $regex: search, $options: 'i' } },
            { studentNames: { $regex: search, $options: 'i' } },
            { visitorPhone: { $regex: search, $options: 'i' } } // phone is included in intermediate project specifically for search
        ];
    }

    let sortField = sortBy;
    if (sortBy === 'visitorName') sortField = 'visitorName';

    const sortStage = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

    const { data, total } = await visitorRepository.getVisitorVisits(
        matchStage,
        searchMatchStage,
        sortStage,
        skip,
        Number(limit)
    );

    const totalPages = Math.ceil(total / Number(limit));

    return { total, page: Number(page), limit: Number(limit), totalPages, data };
};

/**
 * Gets complete visit details with strict role-based authorization and data masking
 * @param {String} visitId 
 * @param {Object} user 
 */
export const getVisitDetails = async (visitId, user) => {
    const visit = await visitorRepository.getVisitDetailsById(visitId);
    if (!visit) {
        const error = new Error('Visit not found.');
        error.status = 404;
        throw error;
    }

    // 1. Role-Based Authorization
    const visitStudentIds = visit.students.map(s => s._id.toString());
    const visitHostelId = visit.hostelId ? visit.hostelId._id.toString() : null;
    const visitOrganizationId = visit.organizationId ? visit.organizationId._id.toString() : null;

    if (user.role === 'admin') {
        if (visitOrganizationId !== user.organization.toString()) {
            throw Object.assign(new Error('Unauthorized: Organization mismatch.'), { status: 403 });
        }
    } else if (user.role === 'warden') {
        const Hostel = mongoose.model('Hostel');
        const wardenHostel = await Hostel.findOne({ wardens: user.id }, '_id');
        if (!wardenHostel) {
            throw Object.assign(new Error('Unauthorized: Not assigned to any hostel.'), { status: 403 });
        }
        if (visitHostelId !== wardenHostel._id.toString()) {
            throw Object.assign(new Error('Unauthorized: Hostel mismatch.'), { status: 403 });
        }
    } else if (user.role === 'student') {
        if (!visitStudentIds.includes(user.id)) {
            throw Object.assign(new Error('Unauthorized: Visit not assigned to this student.'), { status: 403 });
        }
    } else if (user.role === 'parent') {
        const currentParent = await Parent.findById(user.id);
        if (!currentParent) throw Object.assign(new Error('Parent not found.'), { status: 404 });

        const parentDocs = await Parent.find({ phone: currentParent.phone, isActive: true });
        const authorizedStudentIds = parentDocs.map(p => p.studentId.toString());

        const hasOverlap = visitStudentIds.some(id => authorizedStudentIds.includes(id));
        if (!hasOverlap) {
            throw Object.assign(new Error('Unauthorized: Visit not linked to your students.'), { status: 403 });
        }
    }

    // 2. Field-Level Security (ID Proof Masking)
    let maskedIdProofNumber = null;
    if (visit.visitor && visit.visitor.refId.idProofNumber) {
        const isSuperAdminOrAdmin = ['super_admin', 'admin'].includes(user.role);

        if (isSuperAdminOrAdmin) {
            maskedIdProofNumber = visit.visitor.refId.idProofNumber;
        } else {
            // Mask all but last 4 characters
            const num = visit.visitor.refId.idProofNumber;
            if (num.length > 4) {
                maskedIdProofNumber = '*'.repeat(num.length - 4) + num.slice(-4);
            } else {
                maskedIdProofNumber = '****';
            }
        }
    }

    // 3. Process Timeline & DTO Transformation
    const sortedTimeline = (visit.visitTimeline || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const formattedTimeline = sortedTimeline.map(t => ({
        action: t.action,
        performedBy: t.performedBy ? t.performedBy.name : 'System',
        role: t.performedBy ? t.performedBy.role : 'System',
        remarks: t.remarks,
        createdAt: t.createdAt
    }));

    const formattedStudents = visit.students.map(s => ({
        studentId: s._id,
        studentName: s.name,
        studentIdNumber: s.studentId,
        roomNumber: s.roomNumber || null,
        department: s.department || null,
        course: s.course || null
    }));

    // Calculate Visit Duration if checked out
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
    const visitorName = visit.visitor ? visit.visitor.refId.name : 'Unknown';

    return {
        // Quick Summary
        quickSummary: {
            visitorName,
            studentNames,
            currentStatus: visit.status,
            visitDuration,
            checkIn: visit.checkInTime,
            checkOut: visit.checkOutTime
        },

        // Visitor Information
        visitorInformation: visit.visitor ? {
            visitorId: visit.visitor.refId._id,
            visitorName: visit.visitor.refId.name,
            phone: visit.visitor.refId.phone,
            relationship: visit.visitor.refId.relationship,
            address: visit.visitor.refId.address,
            idProofType: visit.visitor.refId.idProofType,
            idProofNumber: maskedIdProofNumber
        } : null,

        // Visit Information
        visitInformation: {
            visitId: visit._id,
            purpose: visit.purpose, // If added later in schema
            status: visit.status,
            checkInTime: visit.checkInTime,
            expectedExitTime: visit.expectedExitTime,
            checkOutTime: visit.checkOutTime,
            visitDuration
        },

        // Student Information
        studentInformation: formattedStudents,

        // Hostel Information
        hostelInformation: {
            hostelId: visit.hostelId ? visit.hostelId._id : null,
            hostelName: visit.hostelId ? visit.hostelId.name : null,
            organizationName: visit.organizationId ? visit.organizationId.name : null
        },

        // Warden Information
        wardenInformation: {
            checkedInBy: visit.checkedInBy ? { name: visit.checkedInBy.name, role: visit.checkedInBy.role } : null,
            checkedOutBy: visit.checkedOutBy ? { name: visit.checkedOutBy.name, role: visit.checkedOutBy.role } : null
        },

        // Timeline
        timeline: formattedTimeline
    };
};

/**
 * Automatically completes expired visits.
 * Meant to be called by a background cron job.
 * @returns {Promise<{processedCount: number, failedCount: number}>}
 */
export const autoCompleteExpiredVisits = async () => {
    let processedCount = 0;
    let failedCount = 0;
    const BATCH_SIZE = 50;

    try {
        const expiredVisits = await visitorRepository.getExpiredVisits(BATCH_SIZE);
        if (expiredVisits.length === 0) {
            return { processedCount, failedCount };
        }

        console.log(`[VisitorService] Found ${expiredVisits.length} expired visits. Processing...`);

        for (const visit of expiredVisits) {
            try {
                // Ensure idempotent processing by re-verifying status before updating if needed,
                // but repository query already ensures they are 'Checked In'.
                const completionTime = new Date();
                const updatedVisit = await visitorRepository.autoCompleteVisit(visit._id, completionTime);

                if (!updatedVisit) {
                    console.warn(`[VisitorService] Visit ${visit._id} could not be updated.`);
                    failedCount++;
                    continue;
                }

                // Gather data for notifications
                const personName = visit.visitor?.refId?.name || visit.visitor?.refId?.parentName || 'Visitor';
                const studentNames = visit.students?.map(s => s.name).join(', ') || 'Student';
                const studentIds = visit.students?.map(s => s._id.toString()) || [];

                const notificationData = {
                    personName,
                    studentName: studentNames,
                    purpose: updatedVisit.purpose || 'Visit',
                    checkInTime: updatedVisit.checkInTime,
                    checkOutTime: updatedVisit.checkOutTime,
                    link: '/dashboard/visitors/history'
                };

                const notificationSender = {
                    id: visit.organizationId,
                    type: 'organization'
                };

                // Notify parent/visitor
                if (visit.visitor?.refType === 'Parent') {
                    await orchestratorService.triggerNotification({
                        eventName: 'VISIT_AUTO_CHECKED_OUT',
                        target: {
                            type: 'USER',
                            filter: { role: 'parent', userIds: [visit.visitor.refId._id.toString()] }
                        },
                        data: notificationData,
                        sender: notificationSender
                    });
                } else if (visit.visitor?.refType === 'Visitor') {
                    // Assuming we notify linked parents if it's a general visitor
                    await orchestratorService.triggerNotification({
                        eventName: 'VISIT_AUTO_CHECKED_OUT',
                        target: {
                            type: 'USER',
                            filter: { role: 'parent', studentIds: studentIds }
                        },
                        data: notificationData,
                        sender: notificationSender
                    });
                }

                // Notify students
                await orchestratorService.triggerNotification({
                    eventName: 'VISIT_AUTO_CHECKED_OUT',
                    target: {
                        type: 'USER',
                        filter: { role: 'student', userIds: studentIds }
                    },
                    data: notificationData,
                    sender: notificationSender
                });

                processedCount++;
            } catch (err) {
                console.error(`[VisitorService] Failed to auto-complete visit ${visit._id}:`, err);
                failedCount++;
            }
        }
    } catch (error) {
        console.error(`[VisitorService] Error in autoCompleteExpiredVisits:`, error);
        throw error;
    }

    return { processedCount, failedCount };
};

/**
 * Parent updates a visitor profile
 * @param {String} visitorId 
 * @param {Object} payload 
 * @param {Object} user 
 */
export const updateVisitorProfile = async (visitorId, payload, user, explicitStudentId = null) => {
    // 1. Fetch Visitor
    const visitor = await visitorRepository.findVisitorById(visitorId);
    if (!visitor) {
        throw Object.assign(new Error('Visitor not found.'), { status: 404 });
    }

    // 2. Validate Ownership
    let authorizedStudentIds = [];
    const studentParentLinks = await StudentParent.find({ parentId: user.id, status: 'active' });
    if (!studentParentLinks || studentParentLinks.length === 0) {
        throw Object.assign(new Error('Parent is inactive or not linked to any students.'), { status: 403 });
    }

    if (explicitStudentId) {
        const isAuthorized = studentParentLinks.some(link => link.studentId.toString() === explicitStudentId);
        if (!isAuthorized) {
            throw Object.assign(new Error('Unauthorized access to this student.'), { status: 403 });
        }
        authorizedStudentIds = [explicitStudentId];
    } else {
        authorizedStudentIds = studentParentLinks.map(link => link.studentId.toString());
    }

    const visitorStudentIds = visitor.students.map(id => id.toString());

    let isCreator = false;
    if (visitor.approvalTimeline && visitor.approvalTimeline.length > 0) {
        const creationEvent = visitor.approvalTimeline.find(t => t.action === VISITOR_APPROVAL_ACTIONS.CREATED);
        if (creationEvent && creationEvent.performedBy && creationEvent.performedBy.toString() === user.id) {
            isCreator = true;
        }
    }

    const hasOverlap = visitorStudentIds.some(id => authorizedStudentIds.includes(id));
    if (!hasOverlap && !isCreator) {
        throw Object.assign(new Error('Unauthorized: You can only update your own visitors.'), { status: 403 });
    }

    // 3. Filter allowed fields and check for changes
    const allowedFields = [
        'name', 'relationship', 'idProofType', 'idProofNumber', 'address', 'email', 'phone'
    ];
    const updateData = {};
    const updatedFieldsList = [];
    for (const key of Object.keys(payload)) {
        if (allowedFields.includes(key) && payload[key] !== undefined) {
            if (visitor[key] !== payload[key]) {
                updateData[key] = payload[key];
                updatedFieldsList.push(key);
            }
        }
    }

    if (Object.keys(updateData).length === 0) {
        return {
            visitorId: visitor._id,
            name: visitor.name,
            phone: visitor.phone,
            email: visitor.email,
            address: visitor.address,
            photoUrl: visitor.photoUrl,
            updatedAt: visitor.updatedAt
        };
    }

    if (updateData.phone) {
        const existingVisitor = await visitorRepository.findDuplicateVisitor(visitor.organizationId, updateData.phone);
        if (existingVisitor && existingVisitor._id.toString() !== visitorId) {
            const error = new Error('Another visitor is already registered with this phone number in the organization.');
            error.status = 400;
            throw error;
        }
    }

    // 4. Update and revert to Pending Status
    updateData.approvalStatus = VISITOR_STATUS.PENDING;

    const timelineEntry = {
        action: 'Updated & Needs Re-approval',
        performedBy: user.id,
        remarks: `Sensitive info updated (${updatedFieldsList.join(', ')}). Needs re-approval.`
    };

    const updatedVisitor = await visitorRepository.updateVisitorStatus(


        visitorId,
        updateData,
        timelineEntry
    );

    // 5. Notify
    try {
        const students = await Student.find({ _id: { $in: visitor.students } }, 'name hostelId');
        const studentNames = students.map(s => s.name).join(', ');
        const hostelId = students.length > 0 ? students[0].hostelId : null;

        await orchestratorService.triggerNotification({
            eventName: 'VISITOR_UPDATE_PENDING',
            target: [
                {
                    type: 'USER',
                    filter: {
                        hostelId: hostelId,
                        organizationId: visitor.organizationId.toString()
                    }
                },
                {
                    type: 'MENTOR',
                    filter: {
                        studentIds: visitor.students.map(id => id.toString())
                    }
                }
            ],
            data: {
                visitorName: visitor.name,
                updatedFields: updatedFieldsList.join(', '),
                studentNames: studentNames,
                link: '/dashboard/visitors'
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
        console.error('[VisitorService] Failed to publish VISITOR_UPDATE_PENDING event:', notificationError);
    }

    return {
        visitorId: updatedVisitor._id,
        name: updatedVisitor.name,
        phone: updatedVisitor.phone,
        email: updatedVisitor.email,
        address: updatedVisitor.address,
        photoUrl: updatedVisitor.photoUrl,
        updatedAt: updatedVisitor.updatedAt
    };
};

