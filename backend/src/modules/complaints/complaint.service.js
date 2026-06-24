import Complaint from "./complaint.model.js";
import Student from "../students/student.model.js";

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
        roomNo: complaintData.roomNo,
        subject: complaintData.subject,
        description: complaintData.description,
        status: 'Pending',
        timeline: [
            {
                status: 'Pending',
                message: 'Complaint registered by this student',
                by: 'Student',
                date: new Date()
            }
        ]
    });

    const savedComplaint = await newComplaint.save();
    return await Complaint.findById(savedComplaint._id).populate('category', 'name');
};

// Get complaints for a specific student
export const getStudentComplaintsDb = async (userId) => {
    const student = await Student.findById(userId);
    if (!student) throw new Error("Student not found.");

    return await Complaint.find({ studentId: student._id })
        .populate('category', 'name')
        .sort({ createdAt: -1 });
};

// Get all complaints for admins/wardens
export const getAllComplaintsDb = async (query = {}) => {
    // Query can include organizationId, hostelId based on the admin's scope
    const filter = {};
    if (query.organizationId) filter.organizationId = query.organizationId;
    if (query.hostelId) filter.hostelId = query.hostelId;
    if (query.status) filter.status = query.status;

    return await Complaint.find(filter)
        .populate('category', 'name')
        .populate('studentId', 'name studentId')
        .populate('hostelId', 'name')
        .populate('organizationId', 'name')
        .sort({ createdAt: -1 });
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
