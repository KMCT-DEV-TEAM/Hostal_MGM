import mongoose from 'mongoose';
import StudentParent from '../../parents/studentParent.model.js';
import * as visitorHistoryRepository from './visitorHistory.repository.js';



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

    const { data, total } = await visitorHistoryRepository.getSuperAdminHostelVisitSummaryAggregated(
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

    const { data, total } = await visitorHistoryRepository.getVisitorVisits(
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
    const visit = await visitorHistoryRepository.getVisitDetailsById(visitId);
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
