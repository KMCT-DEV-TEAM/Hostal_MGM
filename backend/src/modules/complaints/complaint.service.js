import Complaint from "./complaint.model.js";
import Student from "../students/student.model.js";
import User from "../users/user.model.js";

// Create a new complaint
export const createComplaintDb = async (complaintData, user) => {
    // Determine the student info based on user role.
    // If the user is a student, we assume req.user.studentId or req.user.id maps to the Student model.
    // We will query the Student collection to get hostelId and organizationId.
    const student = await Student.findById(user.id);
    if (!student) {
        throw new Error("Student record not found for the logged-in user.");
    }

    const newComplaint = new Complaint({
        studentId: student._id,
        hostelId: student.hostelId,
        organizationId: student.organizationId,
        category: complaintData.category,
        roomNo: student.roomNumber,
        subject: complaintData.subject,
        description: complaintData.description,
        status: 'Pending',
        timeline: [
            {
                status: 'Pending',
                message: `${student.name} registered complaint`,
                by: 'Student',
                date: new Date()
            }
        ]
    });

    const savedComplaint = await newComplaint.save();
    return await Complaint.findById(savedComplaint._id).populate('category', 'name');
};

// Get complaints for a specific student
export const getStudentComplaintsDb = async (userId, type = 'all') => {
    const student = await Student.findById(userId);
    if (!student) throw new Error("Student not found.");

    const query = { studentId: student._id };

    if (type === 'history') {
        query.status = { $in: ['Resolved', 'Rejected', 'Incomplete'] };
    } else if (type === 'current' || type === 'active') {
        query.status = { $nin: ['Resolved', 'Rejected', 'Incomplete'] };
    }

    const stats = {
        total: await Complaint.countDocuments({ studentId: student._id }),
        resolved: await Complaint.countDocuments({ studentId: student._id, status: { $in: ['Resolved', 'Rejected'] } }),
        pending: await Complaint.countDocuments({ studentId: student._id, status: { $nin: ['Resolved', 'Rejected'] } })
    };

    const complaints = await Complaint.find(query)
        .populate('category', 'name')
        .populate('hostelId', 'name')
        .sort({ createdAt: -1 });

    return { complaints, stats };
};

// Get complaints for a specific warden based on hostelId
export const getWardenComplaintsDb = async (wardenId) => {
    const warden = await User.findById(wardenId);
    if (!warden || !warden.hostelId) throw new Error("Warden or associated hostel not found.");

    return await Complaint.find({ hostelId: warden.hostelId })
        .populate('category', 'name')
        .populate('studentId', 'name studentId roomNo')
        .sort({ createdAt: -1 });
};

// Update complaint
export const updateComplaintDb = async (complaintId, user, updateData) => {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
        throw new Error("Complaint not found.");
    }

    // Ensure the complaint belongs to the student trying to update it, unless it's an admin/warden
    if (user.role === 'student') {
        const student = await Student.findById(user.id);
        if (!student || complaint.studentId.toString() !== student._id.toString()) {
            throw new Error("You do not have permission to update this complaint.");
        }

        // Only allow student to update if status is 'Pending'
        if (complaint.status !== 'Pending') {
            throw new Error("You can only edit pending complaints.");
        }
    } else if (!['admin', 'org_admin', 'warden', 'super_admin'].includes(user.role)) {
        throw new Error("You do not have permission to update this complaint.");
    }

    if (updateData.category) complaint.category = updateData.category;
    if (updateData.roomNo) complaint.roomNo = updateData.roomNo;
    if (updateData.subject) complaint.subject = updateData.subject;
    if (updateData.description !== undefined) complaint.description = updateData.description;
    if (updateData.priority) complaint.priority = updateData.priority;

    let updaterName = "User";
    if (user.role === 'student') {
        const student = await Student.findById(user.id);
        if (student) updaterName = student.name;
    } else {
        const staff = await User.findById(user.id);
        if (staff) updaterName = staff.name;
    }

    const byRole = user.role === 'student' ? 'Student' :
        (user.role === 'warden' ? 'Warden' : 'Admin');

    complaint.timeline.push({
        status: complaint.status,
        message: `Complaint details updated by ${updaterName}`,
        by: byRole,
        date: new Date()
    });

    const savedComplaint = await complaint.save();
    return await Complaint.findById(savedComplaint._id).populate('category', 'name');
};

// Delete complaint
export const deleteComplaintDb = async (complaintId, studentId) => {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
        throw new Error("Complaint not found.");
    }

    const student = await Student.findById(studentId);
    if (!student || complaint.studentId.toString() !== student._id.toString()) {
        throw new Error("You do not have permission to delete this complaint.");
    }

    if (complaint.status !== 'Pending') {
        throw new Error("You can only withdraw pending complaints.");
    }

    return await Complaint.findByIdAndDelete(complaintId);
};

// Get all complaints for admins/wardens
export const getAllComplaintsDb = async (query = {}) => {
    // Query can include organizationId, hostelId based on the admin's scope
    const filter = {};
    if (query.organizationId) filter.organizationId = query.organizationId;
    if (query.hostelId) filter.hostelId = query.hostelId;
    if (query.status) {
        if (typeof query.status === 'string' && query.status.includes(',')) {
            filter.status = { $in: query.status.split(',') };
        } else if (Array.isArray(query.status)) {
            filter.status = { $in: query.status };
        } else {
            filter.status = query.status;
        }
    }
    if (query.assignedStaff) filter.assignedStaff = query.assignedStaff;
    if (query._id !== undefined) filter._id = query._id;

    return await Complaint.find(filter)
        .populate('category', 'name')
        .populate('studentId', 'name studentId')
        .populate({
            path: 'hostelId',
            select: 'name wardens',
            populate: {
                path: 'wardens',
                select: 'name'
            }
        })
        .populate('organizationId', 'name')
        .populate('assignedStaff', 'name phone email specialization')
        .sort({ createdAt: -1 });
};

// Get complaint summary by category
export const getComplaintSummaryDb = async (query = {}) => {
    const filter = {};
    if (query.organizationId) filter.organizationId = query.organizationId;
    if (query.hostelId) filter.hostelId = query.hostelId;

    const result = await Complaint.aggregate([
        { $match: filter },
        {
            $facet: {
                byCategory: [
                    {
                        $group: {
                            _id: "$category",
                            count: { $sum: 1 }
                        }
                    },
                    {
                        $lookup: {
                            from: "complaintcategories",
                            localField: "_id",
                            foreignField: "_id",
                            as: "categoryDetails"
                        }
                    },
                    { $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true } },
                    {
                        $project: {
                            _id: 0,
                            name: { $ifNull: ["$categoryDetails.name", "Unknown"] },
                            count: 1
                        }
                    },
                    { $sort: { count: -1 } }
                ],
                byStatus: [
                    {
                        $group: {
                            _id: "$status",
                            count: { $sum: 1 }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            name: { $ifNull: ["$_id", "Unknown"] },
                            count: 1
                        }
                    },
                    { $sort: { count: -1 } }
                ],
                totalCount: [
                    {
                        $count: "total"
                    }
                ]
            }
        }
    ]);


    const categories = result[0].byCategory || [];
    let statuses = result[0].byStatus || [];
    const totalCount = result[0].totalCount.length > 0 ? result[0].totalCount[0].total : 0;

    const allStatuses = ['Pending', 'In progress', 'Awaiting', 'Resolved', 'Rejected', 'Incomplete'];
    const existingStatuses = new Set(statuses.map(s => s.name));

    allStatuses.forEach(status => {
        if (!existingStatuses.has(status)) {
            statuses.push({ name: status, count: 0 });
        }
    });

    statuses.sort((a, b) => b.count - a.count);

    return {
        total: totalCount,
        categories: categories,
        statuses: statuses
    };
};

// Update complaint status
export const updateComplaintStatusDb = async (complaintId, newStatus, userRole, message) => {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) throw new Error("Complaint not found.");

    complaint.status = newStatus;

    // Add to timeline
    complaint.timeline.push({
        status: newStatus,
        message: message || `Status updated to ${newStatus}`,
        by: userRole || 'Admin',
        date: new Date()
    });

    return await complaint.save();
};

// Assign staff to complaint
export const assignStaffToComplaintDb = async (complaintId, staffId, userRole) => {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) throw new Error("Complaint not found.");

    const staff = await User.findById(staffId);
    if (!staff) throw new Error("Staff member not found.");

    complaint.assignedStaff = staffId;
    complaint.status = 'In progress';

    const roleName = staff.role === 'warden' ? 'Warden' : 'maintenance user';

    // Add to timeline
    complaint.timeline.push({
        status: 'In progress',
        message: `Admin assigned to this ${roleName} ${staff.name}`,
        by: userRole || 'Admin',
        date: new Date()
    });

    return await complaint.save();
};

// Maintenance staff or Warden submits resolution
export const submitComplaintResolutionDb = async (complaintId, staffId, materialsUsed, resolutionNotes) => {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) throw new Error("Complaint not found.");

    if (complaint.assignedStaff?.toString() !== staffId.toString()) {
        throw new Error("You are not assigned to this complaint.");
    }

    const staff = await User.findById(staffId);
    const isWarden = staff.role === 'warden';

    complaint.status = isWarden ? 'Resolved' : 'Awaiting';
    complaint.materialsUsed = materialsUsed;
    complaint.resolutionNotes = resolutionNotes;

    complaint.timeline.push({
        status: isWarden ? 'Resolved' : 'Awaiting',
        message: isWarden
            ? 'Warden submitted resolution and resolved the complaint directly.'
            : 'Maintenance staff submitted resolution and is awaiting approval.',
        by: isWarden ? 'Warden' : 'Maintenance Staff',
        date: new Date()
    });

    return await complaint.save();
};

// Warden approves resolution
export const approveComplaintResolutionDb = async (complaintId, userRole) => {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) throw new Error("Complaint not found.");

    if (complaint.status !== 'Awaiting') {
        throw new Error("Complaint is not awaiting approval.");
    }

    complaint.status = 'Resolved';

    complaint.timeline.push({
        status: 'Resolved',
        message: 'Resolution approved and complaint marked as resolved.',
        by: userRole || 'Warden',
        date: new Date()
    });

    return await complaint.save();
};

// Warden rejects resolution
export const rejectComplaintResolutionDb = async (complaintId, userRole, rejectNote) => {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) throw new Error("Complaint not found.");

    if (complaint.status !== 'Awaiting') {
        throw new Error("Complaint is not awaiting approval.");
    }

    complaint.status = 'In progress';

    complaint.timeline.push({
        status: 'In progress',
        message: `Resolution rejected. Note: ${rejectNote}`,
        by: userRole || 'Warden',
        date: new Date()
    });

    return await complaint.save();
};

// Assigned staff rejects the task
export const rejectAssignedTaskDb = async (complaintId, staffId, rejectNote) => {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) throw new Error("Complaint not found.");

    if (complaint.assignedStaff?.toString() !== staffId.toString()) {
        throw new Error("You are not assigned to this complaint.");
    }

    const staff = await User.findById(staffId);
    const isWarden = staff.role === 'warden';

    complaint.status = 'Rejected';
    // Keeping assignedStaff so it shows up in their table

    complaint.timeline.push({
        status: 'Rejected',
        message: `Assigned task rejected by ${isWarden ? 'Warden' : 'maintenance staff'}. Note: ${rejectNote}`,
        by: isWarden ? 'Warden' : 'Maintenance Staff',
        date: new Date()
    });

    return await complaint.save();
};

// Add internal note to a complaint
export const addInternalNoteDb = async (complaintId, userRole, addedBy, noteText) => {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) throw new Error("Complaint not found.");

    complaint.internalNotes.push({
        note: noteText,
        addedBy: addedBy,
        role: userRole,
        date: new Date()
    });

    return await complaint.save();
};
