import mongoose from 'mongoose';
import {
    createBrandNewVisitorProfile,
    confirmVisitorReuseProfile
} from './visitor.helper.js';
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
    VISITOR_VISIT_TIMELINE_ACTIONS,

} from './visitor.constant.js';
import { orchestratorService } from '../notifications/services/orchestrator.service.js';
import visitorVisitModel from './visitorVisit.model.js';
import visitRequestModel from './visitRequest.model.js';
import hostelModel from '../hostels/hostel.model.js';



/**
 * Facade for Visitor Creation. Routes to either Creation or Confirmation flows.
 */
export const createVisitorProfile = async (payload, user) => {
    if (payload.confirmedVisitorId) {
        return await confirmVisitorReuseProfile(payload, user);
    }
    return await createBrandNewVisitorProfile(payload, user);
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


// ============================================================================
// Staff Visitor Listing Modules
// ============================================================================

/**
 * 1. Authorization & Scope Resolution
 */
const resolveStaffListingScope = async (user, queryOrganization) => {
    const studentMatch = {};
    if (user.role === 'super_admin') {
        if (queryOrganization) {
            studentMatch['studentObj.organizationId'] = new mongoose.Types.ObjectId(queryOrganization);
        }
    } else if (user.role === 'admin') {
        studentMatch['studentObj.organizationId'] = new mongoose.Types.ObjectId(user.organization);
    } else if (user.role === 'warden') {
        const Hostel = mongoose.model('Hostel');
        const wardenHostels = await Hostel.find({ wardens: user.id }, '_id').lean();
        if (!wardenHostels || wardenHostels.length === 0) {
            throw Object.assign(new Error('Unauthorized: You are not assigned to any hostel.'), { status: 403 });
        }
        studentMatch['studentObj.hostelId'] = { $in: wardenHostels.map(h => h._id) };
    } else if (user.role === 'mentor') {
        const MentorAssignment = mongoose.model('MentorAssignment');
        const activeAssignments = await MentorAssignment.find({ mentorId: user.id || user._id, status: "active" }, "batchId").lean();
        const batchIds = activeAssignments.map(a => a.batchId);
        if (batchIds.length === 0) {
            throw Object.assign(new Error('EMPTY_SCOPE'), { status: 200 });
        }
        studentMatch['studentObj.batchId'] = { $in: batchIds };
    } else {
        throw Object.assign(new Error('Unauthorized role to list visitors.'), { status: 403 });
    }
    return studentMatch;
};

/**
 * 2. Filter Construction
 */
const buildListingFilters = (query, studentMatch) => {
    const initialMatch = {};

    if (query.hostel) studentMatch['studentObj.hostelId'] = new mongoose.Types.ObjectId(query.hostel);
    if (query.batch) studentMatch['studentObj.batchId'] = new mongoose.Types.ObjectId(query.batch);
    if (query.department) studentMatch['studentObj.departmentId'] = new mongoose.Types.ObjectId(query.department);
    if (query.course) studentMatch['studentObj.courseId'] = new mongoose.Types.ObjectId(query.course);

    if (query.status) {
        initialMatch.status = query.status.trim();
    }

    if (query.date) {
        const startDate = new Date(query.date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(query.date);
        endDate.setHours(23, 59, 59, 999);
        initialMatch.createdAt = { $gte: startDate, $lte: endDate };
    } else if (query.startDate && query.endDate) {
        initialMatch.createdAt = {
            $gte: new Date(query.startDate),
            $lte: new Date(query.endDate)
        };
    }

    const sortOptions = {};
    if (query.search) {
        const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        sortOptions.search = escapeRegex(query.search.trim());
    }
    if (query.sort) sortOptions.sort = query.sort.trim();

    return { initialMatch, sortOptions };
};

/**
 * 3. Orchestration: Lists visitors for Admin, Super Admin, Warden, and Mentor
 * @param {Object} query 
 * @param {Object} user 
 */
export const listVisitors = async (query, user) => {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);
    const skip = (page - 1) * limit;

    try {
        const studentMatch = await resolveStaffListingScope(user, query.organization);
        const { initialMatch, sortOptions } = buildListingFilters(query, studentMatch);

        const { data, total } = await visitorRepository.getVisitorsList(
            initialMatch,
            studentMatch,
            sortOptions,
            skip,
            limit
        );

        const totalPages = Math.ceil(total / limit);
        return { total, page, limit, totalPages, data };

    } catch (error) {
        if (error.message === 'EMPTY_SCOPE') {
            return { total: 0, page, limit, totalPages: 0, data: [] };
        }
        throw error;
    }
};

/**
 * Lists visitors specifically for the authenticated Parent
 * @param {Object} query 
 * @param {Object} user (Authenticated Parent)
 */
export const listParentVisitors = async (query, user) => {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);
    const skip = (page - 1) * limit;

    const { initialMatch, sortOptions } = buildListingFilters(query, {});

    const { data, total } = await visitorRepository.getVisitorsList(
        initialMatch,
        {},
        sortOptions,
        skip,
        limit,
        user.id // Pass parentIdMatch for Parent scope
    );

    const totalPages = Math.ceil(total / limit);

    return {
        total,
        page,
        limit,
        totalPages,
        data
    };
};



/**
 * Lists visitors specifically for the authenticated Student
 * @param {Object} query 
 * @param {Object} user (Authenticated Student)
 */
export const listStudentVisitors = async (query, user) => {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);
    const skip = (page - 1) * limit;

    const studentMatch = { 'studentObj._id': new mongoose.Types.ObjectId(user.id) };
    const { initialMatch, sortOptions } = buildListingFilters(query, studentMatch);

    const { data, total } = await visitorRepository.getVisitorsList(
        initialMatch,
        studentMatch,
        sortOptions,
        skip,
        limit
    );

    const totalPages = Math.ceil(total / limit);

    return { total, page, limit, totalPages, data };
};

/**
 * Gets a visitor details with strict role-based authorization and data masking
 * @param {String} visitorId 
 * @param {Object} user 
 */
export const getVisitorDetails = async (visitorId, user, explicitStudentId = null) => {
    // 1. Load the base Visitor profile
    const visitor = await visitorRepository.findVisitorById(visitorId);
    if (!visitor) {
        throw Object.assign(new Error('Visitor not found.'), { status: 404 });
    }

    // 2. Fetch all VisitRequests for this visitor
    const visitRequests = await visitRequestModel.find({ visitorId })
        .populate('studentId', 'name roomNumber hostelId batchId organizationId')
        .lean();

    if (!visitRequests || visitRequests.length === 0) {
        throw Object.assign(new Error('Visitor has no active visit requests.'), { status: 404 });
    }

    // 3. Resolve Authorization Bounds
    let wardenHostelIds = [];
    let mentorBatchIds = [];
    let studentParentLinkIds = [];

    if (user.role === 'warden') {
        const wardenHostels = await hostelModel.find({ wardens: user.id }, '_id').lean();
        if (!wardenHostels.length) throw Object.assign(new Error('Unauthorized: Not assigned to any hostel.'), { status: 403 });
        wardenHostelIds = wardenHostels.map(h => h._id.toString());
    } else if (user.role === 'mentor') {
        const activeAssignments = await MentorAssignment.find({ mentorId: user.id || user._id, status: "active" }, "batchId").lean();
        if (!activeAssignments.length) throw Object.assign(new Error('Unauthorized: Not assigned to any batch.'), { status: 403 });
        mentorBatchIds = activeAssignments.map(a => a.batchId.toString());
    } else if (user.role === 'parent' || user.explicitStudentId) {
        const studentParentLinks = await StudentParent.find({ parentId: user.id, status: 'active' }).lean();
        studentParentLinkIds = studentParentLinks.map(link => link.studentId.toString());
        if (explicitStudentId && !studentParentLinkIds.includes(explicitStudentId)) {
            throw Object.assign(new Error('Unauthorized access to this student.'), { status: 403 });
        }
    }

    // 4. Filter VisitRequests based on role
    const authorizedVisitRequests = visitRequests.filter(vr => {
        const student = vr.studentId;
        if (!student) return false;

        if (user.role === 'super_admin') return true;
        if (user.role === 'admin') return student.organizationId?.toString() === user.organization?.toString();
        if (user.role === 'warden') return wardenHostelIds.includes(student.hostelId?.toString());
        if (user.role === 'mentor') return mentorBatchIds.includes(student.batchId?.toString());
        if (user.role === 'student') return student._id.toString() === user.id;
        if (user.role === 'parent') {
            if (explicitStudentId) return student._id.toString() === explicitStudentId;
            return studentParentLinkIds.includes(student._id.toString());
        }

        return false;
    });

    if (authorizedVisitRequests.length === 0) {
        throw Object.assign(new Error('Unauthorized access to this visitor profile.'), { status: 403 });
    }

    // 5. Mask sensitive data
    let maskedIdProofNumber = visitor.idProofNumber;
    if (maskedIdProofNumber) {
        const isSuperAdminOrAdmin = ['super_admin', 'admin'].includes(user.role);
        if (!isSuperAdminOrAdmin) {
            if (maskedIdProofNumber.length > 4) {
                maskedIdProofNumber = '*'.repeat(maskedIdProofNumber.length - 4) + maskedIdProofNumber.slice(-4);
            } else {
                maskedIdProofNumber = '****';
            }
        }
    }

    // 6. Fetch the latest visit for this staff's authorized requests
    const authorizedStudentIds = authorizedVisitRequests.map(vr => vr.studentId._id || vr.studentId);
    const latestVisit = await visitorVisitModel.findOne({
        'visitor.refId': visitorId,
        'students.studentId': { $in: authorizedStudentIds }
    }).sort({ createdAt: -1 }).lean();

    // 7. Format response (Identical to Parent API)
    return {
        visitorId: visitor._id,
        name: visitor.name,
        phone: visitor.phone,
        email: visitor.email,
        address: visitor.address,
        idProofType: visitor.idProofType,
        idProofNumber: maskedIdProofNumber,
        status: visitor.status,
        createdAt: visitor.createdAt,
        updatedAt: visitor.updatedAt,
        changeLog: visitor.changeLog,

        linkedStudents: Object.values(
            authorizedVisitRequests.reduce((acc, vr) => {
                if (vr.studentId && !acc[vr.studentId._id]) {
                    acc[vr.studentId._id] = {
                        _id: vr._id,
                        studentId: vr.studentId._id,
                        name: vr.studentId.name,
                        roomNumber: vr.studentId.roomNumber,
                        sHostelName: vr.studentId.hostelId.name,
                        relationship: vr.relationship,
                        purpose: vr.purpose,
                        requestStatus: vr.status,
                        approvalTimeline: vr.approvalTimeline
                    };
                }
                return acc;
            }, {})
        ),

        latestVisit: latestVisit ? {
            visitId: latestVisit._id,
            status: latestVisit.status,
            checkInTime: latestVisit.checkInTime,
            checkOutTime: latestVisit.checkOutTime
        } : null
    };
};

/**
 * Resolves authorized pending VisitRequests for a user given a visitorId.
 * Used internally by bulk approve/reject.
 */


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
            const wardenHostelDoc = await hostelModel.findOne({ wardens: user.id }, '_id');
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
/**
 * Check-in an approved visitor (V2 - Production Grade)
 * @param {Object} payload 
 * @param {Object} wardenUser 
 */
export const checkInVisitor = async (payload, wardenUser) => {
    const { visitor, selectedStudentIds, purpose, expectedExitTime } = payload;

    if (wardenUser.role !== 'warden') {
        const error = new Error('Unauthorized: Only wardens can check-in visitors.');
        error.status = 403;
        throw error;
    }

    const uniqueStudentIds = [...new Set(selectedStudentIds)];
    if (uniqueStudentIds.length !== selectedStudentIds.length) {
        const error = new Error('Duplicate student IDs provided.');
        error.status = 400;
        throw error;
    }

    let resolvedPerson = null;
    let personName = '';
    let organizationId = null;

    // Fetch Person and Target Students concurrently
    const Student = mongoose.model('Student');
    const [personData, students] = await Promise.all([
        (async () => {
            if (visitor.refType === 'Parent') {
                return await visitorRepository.resolveParentStudents(visitor.refId);
            } else {
                const Visitor = mongoose.model('Visitor');
                const visitorDoc = await Visitor.findById(visitor.refId).lean();
                if (!visitorDoc) return null;
                return {
                    ...visitorDoc,
                    authorizedStudentIds: visitorDoc.students.map(id => id.toString()),
                    personName: visitorDoc.name
                };
            }
        })(),
        Student.find({ _id: { $in: uniqueStudentIds } })
            .select('name isActive hostelStatus hostelId organizationId')
            .lean()
    ]);

    resolvedPerson = personData;

    if (!resolvedPerson) {
        const error = new Error(`${visitor.refType} not found.`);
        error.status = 404;
        throw error;
    }

    // Person validations
    if (visitor.refType === 'Parent') {
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
    } else {
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
    }

    if (students.length !== uniqueStudentIds.length) {
        const error = new Error('One or more selected students not found.');
        error.status = 400;
        throw error;
    }

    // Authorization: Is the visitor/parent authorized to visit these students?
    const isSubset = uniqueStudentIds.every(id => resolvedPerson.authorizedStudentIds.includes(id));
    if (!isSubset) {
        const error = new Error(`${visitor.refType} is not authorized for all selected students.`);
        error.status = 403;
        throw error;
    }

    // Organization and Hostel boundaries
    const targetHostelId = students[0].hostelId?.toString();
    const targetOrgId = students[0].organizationId?.toString();

    if (!targetHostelId) {
        const error = new Error('Student does not have an active hostel.');
        error.status = 400;
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
        if (student.hostelId.toString() !== targetHostelId) {
            const error = new Error(`Selected students belong to different hostels. Must check-in separately per hostel.`);
            error.status = 400;
            throw error;
        }
        if (student.organizationId.toString() !== targetOrgId) {
            const error = new Error(`Selected students belong to different organizations.`);
            error.status = 400;
            throw error;
        }
    }

    organizationId = targetOrgId;

    // Warden Authorization
    const Hostel = mongoose.model('Hostel');
    const targetHostel = await Hostel.findById(targetHostelId).lean();
    if (!targetHostel || !targetHostel.wardens.some(id => id.toString() === wardenUser.id)) {
        const error = new Error('Unauthorized: You are not assigned to the hostel for these students.');
        error.status = 403;
        throw error;
    }

    const now = new Date();
    const parsedExpectedExitTime = new Date(expectedExitTime);

    const visitData = {
        organizationId: organizationId,
        hostelId: targetHostelId,
        visitor: {
            refId: visitor.refId,
            refType: visitor.refType
        },
        students: uniqueStudentIds,
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

    let newVisit;
    try {
        newVisit = await visitorRepository.createVisit(visitData);
    } catch (error) {
        if (error.code === 11000) {
            const e = new Error('This visitor is already checked in. Please add students to the active visit instead.');
            e.status = 409;
            throw e;
        }
        throw error;
    }

    // Fire notifications asynchronously
    try {
        const studentNames = students.map(s => s.name).join(', ');
        const notificationData = {
            personName: resolvedPerson.personName,
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

        orchestratorService.triggerNotification({
            eventName: 'VISIT_CHECKED_IN',
            target: {
                type: 'PARENT',
                filter: {
                    studentIds: uniqueStudentIds,
                    excludeIds: parentExcludeIds
                }
            },
            data: notificationData,
            sender: notificationSender
        }).catch(console.error);

        // Also notify students
        orchestratorService.triggerNotification({
            eventName: 'VISIT_CHECKED_IN',
            target: {
                type: 'USER',
                filter: {
                    role: 'student',
                    userIds: uniqueStudentIds
                }
            },
            data: notificationData,
            sender: notificationSender
        }).catch(console.error);
    } catch (error) {
        console.error('Error firing check-in notifications:', error);
    }

    return {
        visitId: newVisit._id,
        personName: resolvedPerson.personName,
        personType: visitor.refType,
        studentName: newVisit.students?.map(s => s.name).join(', ') || 'Student',
        purpose: newVisit.purpose,
        checkInTime: newVisit.checkInTime,
        expectedExitTime: newVisit.expectedExitTime,
        status: newVisit.status
    };
};

/**
 * Add students to an active visit (V2 - Production Grade)
 * @param {String} visitId 
 * @param {Object} payload 
 * @param {Object} wardenUser 
 */
export const addStudentsToVisit = async (visitId, payload, wardenUser) => {
    const { selectedStudentIds } = payload;

    if (wardenUser.role !== 'warden') {
        const error = new Error('Unauthorized: Only wardens can manage visits.');
        error.status = 403;
        throw error;
    }

    const uniqueStudentIds = [...new Set(selectedStudentIds)];
    if (uniqueStudentIds.length !== selectedStudentIds.length) {
        const error = new Error('Duplicate student IDs provided.');
        error.status = 400;
        throw error;
    }

    // Fetch visit
    const visit = await visitorRepository.getVisitDetailsById(visitId);
    if (!visit) {
        const error = new Error('Visit not found.');
        error.status = 404;
        throw error;
    }

    if (visit.status !== VISITOR_VISIT_STATUS.CHECKED_IN) {
        const error = new Error('Students can only be added to currently active visits.');
        error.status = 400;
        throw error;
    }

    // Filter out already linked students
    const existingStudentIds = visit.students.map(id => id.toString());
    const newStudentIds = uniqueStudentIds.filter(id => !existingStudentIds.includes(id));

    if (newStudentIds.length === 0) {
        const error = new Error('All selected students are already part of this visit.');
        error.status = 400;
        throw error;
    }

    // Fetch Person and Target Students concurrently
    const Student = mongoose.model('Student');
    const [personData, students] = await Promise.all([
        (async () => {
            if (visit.visitor.refType === 'Parent') {
                const Parent = mongoose.model('Parent');
                const StudentParent = mongoose.model('StudentParent');
                const parentDoc = await Parent.findById(visit.visitor.refId).lean();
                if (!parentDoc) return null;
                const links = await StudentParent.find({ parentId: parentDoc._id, status: 'active' }).select('studentId').lean();
                return {
                    authorizedStudentIds: links.map(l => l.studentId.toString()),
                    personName: parentDoc.parentName
                };
            } else {
                const Visitor = mongoose.model('Visitor');
                const visitorDoc = await Visitor.findById(visit.visitor.refId).lean();
                if (!visitorDoc) return null;
                return {
                    authorizedStudentIds: visitorDoc.students.map(id => id.toString()),
                    personName: visitorDoc.name
                };
            }
        })(),
        Student.find({ _id: { $in: newStudentIds } })
            .select('name isActive hostelStatus hostelId organizationId')
            .lean()
    ]);

    if (!personData) {
        const error = new Error(`${visit.visitor.refType} profile no longer exists.`);
        error.status = 404;
        throw error;
    }

    if (students.length !== newStudentIds.length) {
        const error = new Error('One or more selected students not found.');
        error.status = 400;
        throw error;
    }

    // Subset Verification
    const isSubset = newStudentIds.every(id => personData.authorizedStudentIds.includes(id));
    if (!isSubset) {
        const error = new Error(`${visit.visitor.refType} is not authorized for all newly selected students.`);
        error.status = 403;
        throw error;
    }

    // Organization and Hostel boundaries (must match the existing visit)
    const targetHostelId = visit.hostelId.toString();
    const targetOrgId = visit.organizationId.toString();

    for (const student of students) {
        if (!student.isActive) {
            const error = new Error(`Student ${student.name} is inactive.`);
            error.status = 400;
            throw error;
        }
        if (student.hostelStatus !== 'active') {
            const error = new Error(`Student ${student.name} does not have an active hostel status.`);
            error.status = 400;
            throw error;
        }
        if (student.hostelId.toString() !== targetHostelId) {
            const error = new Error(`Student ${student.name} belongs to a different hostel. Must check-in separately.`);
            error.status = 400;
            throw error;
        }
        if (student.organizationId.toString() !== targetOrgId) {
            const error = new Error(`Student ${student.name} belongs to a different organization.`);
            error.status = 400;
            throw error;
        }
    }

    // Warden Authorization
    const Hostel = mongoose.model('Hostel');
    const targetHostel = await Hostel.findById(targetHostelId).lean();
    if (!targetHostel || !targetHostel.wardens.some(id => id.toString() === wardenUser.id)) {
        const error = new Error('Unauthorized: You are not assigned to the hostel for these students.');
        error.status = 403;
        throw error;
    }

    // Update Visit
    const studentNames = students.map(s => s.name).join(', ');
    const timelineEntry = {
        action: VISITOR_VISIT_TIMELINE_ACTIONS.STUDENT_ADDED,
        performedBy: wardenUser.id,
        remarks: `Added ${studentNames} to the visit.`
    };

    const updatedVisit = await visitorVisitModel.findByIdAndUpdate(
        visitId,
        {
            $addToSet: {
                students: { $each: newStudentIds }
            },
            $push: {
                visitTimeline: timelineEntry
            }
        },
        { new: true }
    );

    // Notifications (Optional)
    try {
        const notificationData = {
            personName: personData.personName,
            personType: visit.visitor.refType,
            studentName: studentNames,
            purpose: visit.purpose,
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

        const parentExcludeIds = visit.visitor.refType === 'Parent' ? [visit.visitor.refId.toString()] : [];

        orchestratorService.triggerNotification({
            eventName: 'VISIT_STUDENT_ADDED',
            target: {
                type: 'PARENT',
                filter: {
                    studentIds: newStudentIds,
                    excludeIds: parentExcludeIds
                }
            },
            data: notificationData,
            sender: notificationSender
        }).catch(console.error);

        orchestratorService.triggerNotification({
            eventName: 'VISIT_STUDENT_ADDED',
            target: {
                type: 'USER',
                filter: {
                    role: 'student',
                    userIds: newStudentIds
                }
            },
            data: notificationData,
            sender: notificationSender
        }).catch(console.error);
    } catch (error) {
        console.error('Error firing add students notifications:', error);
    }

    return updatedVisit;
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
export const listVisitorVisits = async (query, user, explicitStudentId = null) => {
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
    } else if (user.role === 'parent' || user.explicitStudentId || explicitStudentId) {
        let authorizedStudentIds = [];
        const studentParentLinks = await StudentParent.find({ parentId: user.id, status: 'active' });

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
            return { total: 0, page: Number(page), limit: Number(limit), totalPages: 0, data: [] };
        }
        matchStage.students = { $in: authorizedStudentIds.map(id => new mongoose.Types.ObjectId(id)) };


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
export const getVisitDetails = async (visitId, user, explicitStudentId = null) => {
    // 1. Fetch from repository with necessary populations
    const visit = await visitorRepository.getVisitDetailsById(visitId);
    if (!visit) {
        throw Object.assign(new Error('Visitor visit not found.'), { status: 404 });
    }

    const visitStudentIds = visit.students.map(s => s._id.toString());
    const visitHostelId = visit.hostelId ? visit.hostelId._id.toString() : null;
    const visitOrganizationId = visit.organizationId ? visit.organizationId._id.toString() : null;

    let visibleStudentIds = [...visitStudentIds]; // Default to all students

    if (user.role === 'admin') {
        if (visitOrganizationId !== user.organization.toString()) {
            throw Object.assign(new Error('Unauthorized: Organization mismatch.'), { status: 403 });
        }
    } else if (user.role === 'warden') {
        const Hostel = mongoose.model('Hostel');
        // Find all hostels the warden manages
        const wardenHostels = await Hostel.find({ wardens: user.id }, '_id');

        if (!wardenHostels || wardenHostels.length === 0) {
            throw Object.assign(new Error('Unauthorized: Not assigned to any hostel.'), { status: 403 });
        }

        const wardenHostelIds = wardenHostels.map(h => h._id.toString());

        // Filter visible students to only those in the warden's hostel(s)
        visibleStudentIds = visit.students.filter(s => {
            const shId = s.hostelId ? (s.hostelId._id || s.hostelId).toString() : visitHostelId;
            return wardenHostelIds.includes(shId);
        }).map(s => s._id.toString());

        if (visibleStudentIds.length === 0) {
            throw Object.assign(new Error('Unauthorized: No students in this visit belong to your hostel.'), { status: 403 });
        }
    } else if (user.role === 'student') {
        if (!visitStudentIds.includes(user.id)) {
            throw Object.assign(new Error('Unauthorized: Visit not assigned to this student.'), { status: 403 });
        }
        visibleStudentIds = [user.id]; // Student only sees themselves
    } else if (user.role === 'parent' || user.explicitStudentId || explicitStudentId) {
        let authorizedStudentIds = [];
        const studentParentLinks = await StudentParent.find({ parentId: user.id, status: 'active' });

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

        // Filter visible students to only the parent's authorized children
        visibleStudentIds = authorizedStudentIds.filter(id => visitStudentIds.includes(id));
        if (visibleStudentIds.length === 0) {
            throw Object.assign(new Error('Unauthorized: Visit not linked to your authorized students.'), { status: 403 });
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

    // Format students and filter out students the user shouldn't see
    const formattedStudents = visit.students
        .filter(s => visibleStudentIds.includes(s._id.toString()))
        .map(s => {
            const sHostelId = s.hostelId ? (s.hostelId._id || s.hostelId).toString() : visitHostelId;
            const sHostelName = s.hostelId && s.hostelId.name ? s.hostelId.name : (visit.hostelId ? visit.hostelId.name : null);

            const sOrgId = s.organizationId ? (s.organizationId._id || s.organizationId).toString() : visitOrganizationId;
            const sOrgName = s.organizationId && s.organizationId.name ? s.organizationId.name : (visit.organizationId ? visit.organizationId.name : null);

            return {
                studentId: s._id,
                studentName: s.name,
                roomNumber: s.roomNumber || null,
                hostelDetails: {
                    hostelId: sHostelId,
                    hostelName: sHostelName
                }

            };
        });

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

    // Only join names of students this user is allowed to see
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
        updatedAt: updatedVisitor.updatedAt
    };
};

import { authorizeVisitRequest, validateVisitRequestTransition } from './visitor.helper.js';

/**
 * Approve a single VisitRequest
 * @param {String} visitRequestId 
 * @param {Object} user (Staff/Mentor)
 * @param {Object} session (Optional MongoDB transaction session)
 */
export const approveVisitRequest = async (visitRequestId, user, session = null) => {
    // 1. Fetch VisitRequest with populated auth data
    const visitRequest = await visitorRepository.findVisitRequestWithAuthorizationData(visitRequestId, session);
    if (!visitRequest) {
        throw Object.assign(new Error('VisitRequest not found.'), { status: 404 });
    }

    // 2. Validate State Transition
    validateVisitRequestTransition(visitRequest.status, VISITOR_STATUS.APPROVED);

    // 3. Verify Authorization
    await authorizeVisitRequest(visitRequest, user);

    // 4. Prepare audit timeline entry
    const timelineEntry = {
        action: VISITOR_APPROVAL_ACTIONS.APPROVED,
        performedBy: user.id || user._id,
        performedByRole: user.role,
        remarks: `Approved by ${user.role}`
    };

    // 5. Update VisitRequest
    const updatedRequest = await visitorRepository.approveVisitRequest(visitRequestId, timelineEntry, session);

    // (Optional) Trigger notifications here in the future
    try {
        const studentName = visitRequest.studentId?.name || 'Student';
        await orchestratorService.triggerNotification({
            eventName: 'VISITOR_APPROVED',
            target: { type: 'PARENT', filter: { studentIds: [visitRequest.studentId._id.toString()] } },
            data: { visitorName: 'Visitor', studentNames: studentName, link: '/dashboard/visitors' },
            sender: { id: user.id || user._id, model: 'User', snapshot: { name: user.name, role: user.role } }
        });
    } catch (e) {
        console.error('[VisitorService] Failed to publish single VISITOR_APPROVED event:', e);
    }

    return updatedRequest;
};

/**
 * Reject a single VisitRequest
 * @param {String} visitRequestId 
 * @param {String} reason 
 * @param {Object} user (Staff/Mentor)
 * @param {Object} session (Optional MongoDB transaction session)
 */
export const rejectVisitRequest = async (visitRequestId, reason, user, session = null) => {
    // 1. Fetch VisitRequest with populated auth data
    const visitRequest = await visitorRepository.findVisitRequestWithAuthorizationData(visitRequestId, session);
    if (!visitRequest) {
        throw Object.assign(new Error('VisitRequest not found.'), { status: 404 });
    }

    // 2. Validate State Transition
    validateVisitRequestTransition(visitRequest.status, VISITOR_STATUS.REJECTED);

    // 3. Verify Authorization
    await authorizeVisitRequest(visitRequest, user);

    // 4. Prepare audit timeline entry
    const timelineEntry = {
        action: VISITOR_APPROVAL_ACTIONS.REJECTED,
        performedBy: user.id || user._id,
        performedByRole: user.role,
        remarks: reason
    };

    // 5. Update VisitRequest
    const updatedRequest = await visitorRepository.rejectVisitRequest(visitRequestId, timelineEntry, session);

    // (Optional) Trigger notifications here in the future

    return updatedRequest;
};
