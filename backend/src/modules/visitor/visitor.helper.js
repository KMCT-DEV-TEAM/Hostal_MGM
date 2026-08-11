import mongoose from 'mongoose';
import Parent from '../parents/parent.model.js';
import Student from '../students/student.model.js';
import StudentParent from '../parents/studentParent.model.js';
import Visitor from './visitor.model.js';
import VisitRequest from './visitRequest.model.js';
import * as visitorRepository from './visitor.repository.js';
import {
    VISITOR_PROFILE_STATUS,
    VISITOR_STATUS,
    VISITOR_APPROVAL_ACTIONS,
    VISITOR_CHANGE_LOG_ACTIONS
} from './visitor.constant.js';
import { orchestratorService } from '../notifications/services/orchestrator.service.js';
import MentorAssignment from '../mentors/mentorAssignment.model.js';

/**
 * Validates parent account and student authorizations
 */
export const validateParentAndStudents = async (parentId, studentIds) => {
    // ── Step 1: Verify Parent ────────────────────────────────────────────────
    const currentParent = await Parent.findById(parentId).lean();
    if (!currentParent) {
        const error = new Error("We couldn't find your parent profile. Please try logging in again.");
        error.status = 404;
        throw error;
    }
    if (!currentParent.isActive || !currentParent.isVerified) {
        const error = new Error("Your account is currently inactive or not verified. Please contact the hostel administration for assistance.");
        error.status = 403;
        throw error;
    }

    // ── Step 2: Validate Students (Bulk) ─────────────────────────────────────
    const studentParentLinks = await StudentParent.find({ parentId, status: 'active' }).lean();
    const authorizedStudentIds = studentParentLinks.map(link => link.studentId.toString());

    for (const sId of studentIds) {
        if (!authorizedStudentIds.includes(sId.toString())) {
            const error = new Error("You do not have permission to schedule visits for one of the selected students.");
            error.status = 403;
            throw error;
        }
    }

    const students = await Student.find({ _id: { $in: studentIds } }).lean();
    if (students.length !== studentIds.length) {
        const error = new Error("We couldn't find some of the selected students. Please refresh the page and try again.");
        error.status = 404;
        throw error;
    }

    for (const student of students) {
        if (!student.isActive) {
            const error = new Error(`The student '${student.name}' is currently inactive, so you cannot schedule a visit for them.`);
            error.status = 400;
            throw error;
        }
        if (student.hostelStatus !== 'active' || !student.hostelId) {
            const error = new Error(`The student '${student.name}' is not currently assigned to a hostel, so you cannot schedule a visit.`);
            error.status = 400;
            throw error;
        }
    }

    return { parent: currentParent, students };
};

/**
 * Checks blocking policies like active visits and pending requests
 */
export const checkBlockingPolicies = async (existingVisitor, studentIds) => {
    if (!existingVisitor) return;

    if (existingVisitor.status !== VISITOR_PROFILE_STATUS.ACTIVE) {
        const error = new Error("This visitor's profile has been deactivated. Please contact the hostel administration.");
        error.status = 403;
        throw error;
    }

    const blockingRequests = await visitorRepository.findBlockingVisitRequests(
        existingVisitor._id.toString(),
        studentIds
    );
    if (blockingRequests.length > 0) {
        const blockingNames = blockingRequests.map(br => br.studentId?.name || 'Unknown Student').join(', ');
        const error = new Error(`A visit request already exists for ${blockingNames}. Please unselect them to continue with the others.`);
        error.status = 409;
        throw error;
    }

    const activeVisits = await visitorRepository.findActiveVisitorVisits(
        existingVisitor._id.toString(),
        studentIds
    );
    if (activeVisits.length > 0) {
        const error = new Error("This visitor is already inside the hostel visiting the selected student(s).");
        error.status = 409;
        throw error;
    }
};

export const createBrandNewVisitorProfile = async (payload, user) => {
    const {
        studentIds,
        name,
        relationship,
        phone,
        email,
        address,
        idProofType,
        idProofNumber,
        purpose,
        remarks
    } = payload;

    await validateParentAndStudents(user.id, studentIds);

    let existingVisitor = null;

    // Priority 1: ID Proof (if provided)
    if (idProofType && idProofNumber) {
        existingVisitor = await visitorRepository.findVisitorByIdProof(idProofType, idProofNumber);
    }

    // Priority 2: Phone Number (fallback if ID proof wasn't provided or no match found)
    if (!existingVisitor) {
        existingVisitor = await visitorRepository.findVisitorByPhone(phone);
    }

    if (existingVisitor) {
        if (existingVisitor.status === VISITOR_PROFILE_STATUS.DELETED) {
            const error = new Error("This visitor profile has been deleted. Please contact the administrator.");
            error.status = 409;
            error.code = "VISITOR_DELETED";
            throw error;
        }

        if (existingVisitor.status === VISITOR_PROFILE_STATUS.BLACKLISTED) {
            const error = new Error("This visitor has been blacklisted and cannot be used.");
            error.status = 403;
            error.code = "VISITOR_BLACKLISTED";
            throw error;
        }

        const maskedPhone = existingVisitor.phone ? '*'.repeat(Math.max(0, existingVisitor.phone.length - 4)) + existingVisitor.phone.slice(-4) : null;
        const maskedIdProofNumber = existingVisitor.idProofNumber ? '*'.repeat(Math.max(0, existingVisitor.idProofNumber.length - 4)) + existingVisitor.idProofNumber.slice(-4) : null;

        const existingRequests = await VisitRequest.find({ visitorId: existingVisitor._id, status: { $in: ['Pending', 'Approved'] } })
            .populate('studentId', 'name roomNumber')
            .lean();
        const assignedStudents = existingRequests.map(r => r.studentId);

        return {
            requiresConfirmation: true,
            visitorId: existingVisitor._id.toString(),
            status: existingVisitor.status,
            visitor: {
                id: existingVisitor._id.toString(),
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

    let savedVisitor = null;
    let savedVisitRequests = [];
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            const visitorData = {
                name,
                phone,
                idProofType,
                idProofNumber,
                status: VISITOR_PROFILE_STATUS.ACTIVE,
                createdBy: user.id,
                changeLog: [{
                    action: VISITOR_CHANGE_LOG_ACTIONS.CREATED,
                    performedBy: user.id,
                    performedByRole: 'parent',
                    timestamp: new Date()
                }]
            };
            if (email) visitorData.email = email;
            if (address) visitorData.address = address;

            try {
                savedVisitor = await visitorRepository.createVisitorInSession(visitorData, session);
            } catch (dbError) {
                if (dbError.code === 11000) throw dbError;
                throw dbError;
            }

            for (const sId of studentIds) {
                const visitRequestData = {
                    visitorId: savedVisitor._id,
                    parentId: user.id,
                    studentId: sId,
                    relationship,
                    purpose,
                    status: VISITOR_STATUS.PENDING,
                    remarks: remarks || undefined,
                    approvalTimeline: [{
                        action: VISITOR_APPROVAL_ACTIONS.CREATED,
                        performedBy: user.id || user._id,
                        performedByRole: user.role || 'parent',
                        createdAt: new Date()
                    }]
                };
                const savedVr = await visitorRepository.createVisitRequest(visitRequestData, session);
                savedVisitRequests.push(savedVr);
            }
        });
    } catch (transactionError) {
        // Fallback cleanup if transactions aren't supported on this deployment
        if (savedVisitor && savedVisitor._id) {
            await Visitor.findByIdAndDelete(savedVisitor._id).catch(() => { });
        }
        for (const vr of savedVisitRequests) {
            if (vr && vr._id) {
                await VisitRequest.findByIdAndDelete(vr._id).catch(() => { });
            }
        }

        if (transactionError.code === 11000) {
            let racedVisitor = null;
            if (idProofType && idProofNumber) {
                racedVisitor = await visitorRepository.findVisitorByIdProof(idProofType, idProofNumber);
            }
            if (!racedVisitor) {
                racedVisitor = await visitorRepository.findVisitorByPhone(phone);
            }
            if (!racedVisitor) throw transactionError;

            if (racedVisitor.status === VISITOR_PROFILE_STATUS.DELETED) {
                const error = new Error("This visitor profile has been deleted. Please contact the administrator.");
                error.status = 409;
                error.code = "VISITOR_DELETED";
                throw error;
            }

            if (racedVisitor.status === VISITOR_PROFILE_STATUS.BLACKLISTED) {
                const error = new Error("This visitor has been blacklisted and cannot be used.");
                error.status = 403;
                error.code = "VISITOR_BLACKLISTED";
                throw error;
            }

            const maskedPhone = racedVisitor.phone ? '*'.repeat(Math.max(0, racedVisitor.phone.length - 4)) + racedVisitor.phone.slice(-4) : null;
            const maskedIdProofNumber = racedVisitor.idProofNumber ? '*'.repeat(Math.max(0, racedVisitor.idProofNumber.length - 4)) + racedVisitor.idProofNumber.slice(-4) : null;

            const existingRequests = await VisitRequest.find({ visitorId: racedVisitor._id, status: { $in: ['Pending', 'Approved'] } })
                .populate('studentId', 'name roomNumber')
                .lean();
            const assignedStudents = existingRequests.map(r => r.studentId);

            return {
                requiresConfirmation: true,
                visitorId: racedVisitor._id.toString(),
                status: racedVisitor.status,
                visitor: {
                    id: racedVisitor._id.toString(),
                    name: racedVisitor.name,
                    email: racedVisitor.email,
                    phone: maskedPhone,
                    idProofType: racedVisitor.idProofType,
                    idProofNumber: maskedIdProofNumber,
                    status: racedVisitor.status,
                    assignedStudents
                }
            };
        }
        throw transactionError;
    } finally {
        await session.endSession();
    }

    const students = await Student.find({ _id: { $in: studentIds } }).lean();
    const studentNames = students.map(s => s.name).join(', ');

    Promise.all([
        orchestratorService.triggerNotification({
            eventName: 'VISITOR_CREATED',
            target: [
                { type: 'ROLE', filter: { role: { $in: ['admin'] } } },
                { type: 'MENTOR', filter: { studentIds: studentIds.map(id => id.toString()) } }
            ],
            data: {
                parentName: 'A Parent',
                visitorName: savedVisitor.name,
                studentNames: studentNames,
                link: '/dashboard/visitors'
            }
        })
    ]).catch(err => console.error('[Notification] Error in createBrandNewVisitorProfile:', err));

    return {
        isNewProfile: true,
        requiresConfirmation: false,
        visitor: savedVisitor,
        visitRequests: savedVisitRequests,
        students
    };
};

export const confirmVisitorReuseProfile = async (payload, user) => {
    const {
        studentIds,
        relationship,
        purpose,
        remarks,
        confirmedVisitorId
    } = payload;

    await validateParentAndStudents(user.id, studentIds);

    const existingVisitor = await visitorRepository.findVisitorById(confirmedVisitorId);
    if (!existingVisitor) {
        const error = new Error("The visitor you selected could not be found. Please try creating a new visitor.");
        error.status = 404;
        throw error;
    }

    if (existingVisitor.status === VISITOR_PROFILE_STATUS.DELETED) {
        const error = new Error("This visitor profile has been deleted. Please contact the administrator.");
        error.status = 409;
        error.code = "VISITOR_DELETED";
        throw error;
    }

    if (existingVisitor.status === VISITOR_PROFILE_STATUS.BLACKLISTED) {
        const error = new Error("This visitor has been blacklisted and cannot be used.");
        error.status = 403;
        error.code = "VISITOR_BLACKLISTED";
        throw error;
    }

    const blockingRequests = await visitorRepository.findBlockingVisitRequests(existingVisitor._id.toString(), studentIds);
    const blockingStudentIds = blockingRequests.map(br => br.studentId?._id?.toString() || br.studentId?.toString());
    const validStudentIds = studentIds.filter(sId => !blockingStudentIds.includes(sId.toString()));

    const activeVisits = await visitorRepository.findActiveVisitorVisits(existingVisitor._id.toString(), studentIds);
    if (activeVisits.length > 0) {
        const error = new Error("This visitor is already inside the hostel visiting the selected student(s).");
        error.status = 409;
        throw error;
    }

    if (validStudentIds.length === 0) {
        const error = new Error("You have already submitted a visit request for all the selected students with this visitor. There is no need to create a new one.");
        error.status = 409;
        throw error;
    }

    let savedVisitRequests = [];
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            if (existingVisitor.status === VISITOR_PROFILE_STATUS.INACTIVE) {
                existingVisitor.status = VISITOR_PROFILE_STATUS.ACTIVE;
                if (!existingVisitor.changeLog) existingVisitor.changeLog = [];
                existingVisitor.changeLog.push({
                    action: VISITOR_CHANGE_LOG_ACTIONS.REACTIVATED,
                    performedBy: user.id,
                    performedByRole: "parent",
                    reason: "Visitor reused after becoming inactive.",
                    timestamp: new Date()
                });
                await existingVisitor.save({ session });
            }

            for (const sId of validStudentIds) {
                const visitRequestData = {
                    visitorId: existingVisitor._id,
                    parentId: user.id,
                    studentId: sId,
                    relationship,
                    purpose,
                    status: VISITOR_STATUS.PENDING,
                    remarks: remarks || undefined,
                    approvalTimeline: [{
                        action: VISITOR_APPROVAL_ACTIONS.CREATED,
                        performedBy: user.id || user._id,
                        performedByRole: user.role || 'parent',
                        createdAt: new Date()
                    }]
                };
                const savedVr = await visitorRepository.createVisitRequest(visitRequestData, session);
                savedVisitRequests.push(savedVr);
            }
        });
    } catch (transactionError) {
        // Fallback cleanup if transactions aren't supported on this deployment
        for (const vr of savedVisitRequests) {
            if (vr && vr._id) {
                await VisitRequest.findByIdAndDelete(vr._id).catch(() => { });
            }
        }
        throw transactionError;
    } finally {
        await session.endSession();
    }

    const students = await Student.find({ _id: { $in: validStudentIds } }).lean();
    const studentNames = students.map(s => s.name).join(', ');

    Promise.all([
        orchestratorService.triggerNotification({
            eventName: 'VISITOR_CREATED',
            target: [
                { type: 'ROLE', filter: { role: { $in: ['admin'] } } },
                { type: 'MENTOR', filter: { studentIds: studentIds.map(id => id.toString()) } }
            ],
            data: {
                parentName: 'A Parent',
                visitorName: existingVisitor.name,
                studentNames: studentNames,
                link: '/dashboard/visitors'
            }
        })
    ]).catch(err => console.error('[Notification] Error in confirmVisitorReuseProfile:', err));

    return {
        isNewProfile: false,
        requiresConfirmation: false,
        visitor: existingVisitor,
        visitRequests: savedVisitRequests,
        // students
    };
};

/**
 * Reusable authorization helper for VisitRequest actions (Approve, Reject, Revoke, etc.)
 */
export const authorizeVisitRequest = async (visitRequest, user) => {
    // 1. Role checks
    if (!['super_admin', 'admin', 'mentor'].includes(user.role)) {
        throw Object.assign(new Error('Unauthorized role.'), { status: 403 });
    }

    // super_admin bypasses specific scope checks
    if (user.role === 'super_admin') {
        return true;
    }

    // 2. Extract student info 
    // Expects studentId to be populated
    const student = visitRequest.studentId;
    if (!student || !student._id) {
        throw Object.assign(new Error('VisitRequest student data not populated for authorization.'), { status: 500 });
    }

    // 3. Scope validation based on role
    if (user.role === 'admin') {
        if (!student.organizationId || student.organizationId.toString() !== user.organization?.toString()) {
            throw Object.assign(new Error('Student is outside your organization scope.'), { status: 403 });
        }
        return true;
    }

    if (user.role === 'mentor') {
        const activeAssignments = await MentorAssignment.find({
            mentorId: user.id,
            status: 'active'
        }, 'batchId').lean();
        const activeBatchIds = activeAssignments.map(a => a.batchId.toString());
        if (!student.batchId || !activeBatchIds.includes(student.batchId.toString())) {
            throw Object.assign(new Error('Student is not in your assigned active batches.'), { status: 403 });
        }
        return true;
    }

    throw Object.assign(new Error('Authorization failed.'), { status: 403 });
};

/**
 * Validates whether a state transition on a VisitRequest is allowed
 */
export const validateVisitRequestTransition = (currentStatus, nextStatus) => {
    const validTransitions = {
        [VISITOR_STATUS.PENDING]: [VISITOR_STATUS.APPROVED, VISITOR_STATUS.REJECTED],
        [VISITOR_STATUS.APPROVED]: [VISITOR_STATUS.REVOKED],
        [VISITOR_STATUS.REJECTED]: [], // terminal
        [VISITOR_STATUS.REVOKED]: []   // terminal
    };

    const allowedNext = validTransitions[currentStatus] || [];
    if (!allowedNext.includes(nextStatus)) {
        throw Object.assign(
            new Error(`Invalid status transition from ${currentStatus} to ${nextStatus}.`),
            { status: 400 }
        );
    }
};

// ── Warden Check-In & Student Addition Helpers ─────────────────────────────────────

export const validateWardenRole = (wardenUser) => {
    if (wardenUser.role !== 'warden') {
        const error = new Error('Unauthorized: Only wardens can manage visits.');
        error.status = 403;
        throw error;
    }
};

export const fetchCheckInContext = async (visitorRef, studentIds) => {
    const Student = mongoose.model('Student');
    const [visitRequests, personData, students] = await Promise.all([
        visitorRepository.getVisitRequestsByVisitorAndStudents(visitorRef.refId, studentIds),
        (async () => {
            if (visitorRef.refType === 'Parent') {
                const parentDoc = await Parent.findById(visitorRef.refId).lean();
                if (!parentDoc) return null;
                return {
                    personName: parentDoc.parentName,
                    isActive: parentDoc.isActive,
                    isVerified: parentDoc.isVerified
                };
            } else {
                const visitorDoc = await Visitor.findById(visitorRef.refId).lean();
                if (!visitorDoc) return null;
                return {
                    personName: visitorDoc.name,
                    status: visitorDoc.status
                };
            }
        })(),
        Student.find({ _id: { $in: studentIds } })
            .select('name isActive hostelStatus hostelId organizationId')
            .lean()
    ]);

    if (!personData) {
        const error = new Error(`${visitorRef.refType} profile no longer exists.`);
        error.status = 404;
        throw error;
    }

    if (students.length !== studentIds.length) {
        const error = new Error('One or more selected students not found.');
        error.status = 400;
        throw error;
    }

    return { visitRequests, personData, students };
};

export const validatePersonProfile = (personData, refType) => {
    if (refType === 'Parent') {
        if (!personData.isActive) {
            const error = new Error('Parent profile is inactive.');
            error.status = 400;
            throw error;
        }
        if (!personData.isVerified) {
            const error = new Error('Parent profile is not verified.');
            error.status = 400;
            throw error;
        }
    } else {
        if (personData.status === VISITOR_PROFILE_STATUS.INACTIVE) {
            const error = new Error('Visitor profile is inactive.');
            error.status = 400;
            throw error;
        }
        if (personData.status === VISITOR_PROFILE_STATUS.BLACKLISTED) {
            const error = new Error('Visitor profile is blacklisted.');
            error.status = 400;
            throw error;
        }
        if (personData.status === VISITOR_PROFILE_STATUS.DELETED) {
            const error = new Error('Visitor profile is deleted.');
            error.status = 400;
            throw error;
        }
    }
};

export const validateVisitRequests = (visitRequests, studentIds) => {
    for (const studentId of studentIds) {
        const vr = visitRequests.find(v => v.studentId.toString() === studentId.toString());
        if (!vr) {
            const error = new Error(`No VisitRequest found for one or more selected students.`);
            error.status = 404;
            throw error;
        }
        if (vr.status !== VISITOR_STATUS.APPROVED) {
            const error = new Error(`VisitRequest for student is not Approved (Current status: ${vr.status}).`);
            error.status = 400;
            throw error;
        }
    }
};

export const validateStudentsAndHostelBoundaries = (students, targetHostelId, targetOrgId) => {
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
            const error = new Error(`Student ${student.name} belongs to a different hostel. Must check-in separately.`);
            error.status = 400;
            throw error;
        }
        if (student.organizationId.toString() !== targetOrgId.toString()) {
            const error = new Error(`Student ${student.name} belongs to a different organization.`);
            error.status = 400;
            throw error;
        }
    }
};

export const authorizeWardenForHostel = async (hostelId, wardenId) => {
    const Hostel = mongoose.model('Hostel');
    const targetHostel = await Hostel.findById(hostelId).lean();
    if (!targetHostel || !targetHostel.wardens.some(id => id.toString() === wardenId.toString())) {
        const error = new Error('Unauthorized: You are not assigned to the hostel for these students.');
        error.status = 403;
        throw error;
    }
};

/**
 * Finds a visitor by ID or throws a 404 Error if not found.
 */
export const findVisitorOrThrow = async (visitorId) => {
    const visitor = await visitorRepository.findVisitorById(visitorId);
    if (!visitor) {
        const error = new Error('Visitor not found.');
        error.status = 404;
        throw error;
    }
    return visitor;
};
