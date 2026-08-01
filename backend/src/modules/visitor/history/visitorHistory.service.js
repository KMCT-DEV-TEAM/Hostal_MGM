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


