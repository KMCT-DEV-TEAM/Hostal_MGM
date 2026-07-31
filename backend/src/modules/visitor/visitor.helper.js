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

/**
 * Validates parent account and student authorizations
 */
export const validateParentAndStudents = async (parentId, studentIds) => {
    // ── Step 1: Verify Parent ────────────────────────────────────────────────
    const currentParent = await Parent.findById(parentId).lean();
    if (!currentParent) {
        const error = new Error('Parent not found.');
        error.status = 404;
        throw error;
    }
    if (!currentParent.isActive || !currentParent.isVerified) {
        const error = new Error(
            'Parent account is inactive or not yet verified. ' +
            'Please contact the hostel administration.'
        );
        error.status = 403;
        throw error;
    }

    // ── Step 2: Validate Students (Bulk) ─────────────────────────────────────
    const studentParentLinks = await StudentParent.find({ parentId, status: 'active' }).lean();
    const authorizedStudentIds = studentParentLinks.map(link => link.studentId.toString());

    for (const sId of studentIds) {
        if (!authorizedStudentIds.includes(sId.toString())) {
            const error = new Error(`Unauthorized access to student ID ${sId}.`);
            error.status = 403;
            throw error;
        }
    }

    const students = await Student.find({ _id: { $in: studentIds } }).lean();
    if (students.length !== studentIds.length) {
        const error = new Error('One or more students not found.');
        error.status = 404;
        throw error;
    }

    for (const student of students) {
        if (!student.isActive) {
            const error = new Error(`Student "${student.name}" is inactive and is not eligible for visitor requests.`);
            error.status = 400;
            throw error;
        }
        if (student.hostelStatus !== 'active' || !student.hostelId) {
            const error = new Error(
                `Student "${student.name}" does not have an active hostel assignment.`
            );
            error.status = 400;
            throw error;
        }
    }
};

/**
 * Checks blocking policies like active visits and pending requests
 */
export const checkBlockingPolicies = async (existingVisitor, studentIds) => {
    if (!existingVisitor) return;

    if (existingVisitor.status !== VISITOR_PROFILE_STATUS.ACTIVE) {
        const error = new Error(
            'The visitor profile associated with this identity is not active. ' +
            'Please contact the hostel administration.'
        );
        error.status = 403;
        throw error;
    }

    const blockingRequests = await visitorRepository.findBlockingVisitRequests(
        existingVisitor._id.toString(),
        studentIds
    );
    if (blockingRequests.length > 0) {
        const blockingNames = blockingRequests.map(br => br.studentId?.name || 'Unknown Student').join(', ');
        const error = new Error(
            `Pending or Approved visit requests already exist for: ${blockingNames}. Please deselect them to proceed.`
        );
        error.status = 409;
        throw error;
    }

    const activeVisits = await visitorRepository.findActiveVisitorVisits(
        existingVisitor._id.toString(),
        studentIds
    );
    if (activeVisits.length > 0) {
        const error = new Error(
            'This visitor is currently checked in to the hostel for one or more selected students.'
        );
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

    const existingVisitor = await visitorRepository.findVisitorByIdentity(phone, email, idProofType, idProofNumber);

    if (existingVisitor) {
        const maskedPhone = existingVisitor.phone ? '*'.repeat(Math.max(0, existingVisitor.phone.length - 4)) + existingVisitor.phone.slice(-4) : null;
        const maskedIdProofNumber = existingVisitor.idProofNumber ? '*'.repeat(Math.max(0, existingVisitor.idProofNumber.length - 4)) + existingVisitor.idProofNumber.slice(-4) : null;

        return {
            requiresConfirmation: true,
            visitor: {
                id: existingVisitor._id.toString(),
                name: existingVisitor.name,
                phone: maskedPhone,
                idProofType: existingVisitor.idProofType,
                idProofNumber: maskedIdProofNumber
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
                        performedBy: user.id,
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
            await Visitor.findByIdAndDelete(savedVisitor._id).catch(() => {});
        }
        for (const vr of savedVisitRequests) {
            if (vr && vr._id) {
                await VisitRequest.findByIdAndDelete(vr._id).catch(() => {});
            }
        }

        if (transactionError.code === 11000) {
            const racedVisitor = await visitorRepository.findVisitorByIdentity(phone, email, idProofType, idProofNumber);
            if (!racedVisitor) throw transactionError;

            const maskedPhone = racedVisitor.phone ? '*'.repeat(Math.max(0, racedVisitor.phone.length - 4)) + racedVisitor.phone.slice(-4) : null;
            const maskedIdProofNumber = racedVisitor.idProofNumber ? '*'.repeat(Math.max(0, racedVisitor.idProofNumber.length - 4)) + racedVisitor.idProofNumber.slice(-4) : null;

            return {
                requiresConfirmation: true,
                visitor: {
                    id: racedVisitor._id.toString(),
                    name: racedVisitor.name,
                    phone: maskedPhone,
                    idProofType: racedVisitor.idProofType,
                    idProofNumber: maskedIdProofNumber
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
            target: { type: 'ROLE', filter: { role: { $in: ['admin', 'warden'] } } },
            data: {
                parentName: 'A Parent',
                visitorName: savedVisitor.name,
                studentNames: studentNames
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
        const error = new Error('The confirmed visitor profile no longer exists.');
        error.status = 404;
        throw error;
    }

    await checkBlockingPolicies(existingVisitor, studentIds);

    let savedVisitRequests = [];
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            for (const sId of studentIds) {
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
                        performedBy: user.id,
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
                await VisitRequest.findByIdAndDelete(vr._id).catch(() => {});
            }
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
            target: { type: 'ROLE', filter: { role: { $in: ['admin', 'warden'] } } },
            data: {
                parentName: 'A Parent', 
                visitorName: existingVisitor.name,
                studentNames: studentNames
            }
        })
    ]).catch(err => console.error('[Notification] Error in confirmVisitorReuseProfile:', err));

    return {
        isNewProfile: false,
        requiresConfirmation: false,
        visitor: existingVisitor,
        visitRequests: savedVisitRequests,
        students
    };
};
