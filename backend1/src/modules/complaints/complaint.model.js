import mongoose from "mongoose";

const timelineSchema = new mongoose.Schema({
    status: {
        type: String,
        required: true,
        enum: ['Pending', 'In progress', 'Awaiting', 'Resolved', 'Rejected', 'Incomplete']
    },
    message: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    by: {
        type: String, // e.g. 'Student', 'Admin', 'Warden'
        required: true
    }
}, { _id: false });

const complaintSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },
        hostelId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Hostel",
            required: true,
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ComplaintCategory",
            required: true,
        },
        roomNo: {
            type: String,
            required: true,
            trim: true,
        },
        subject: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ['Pending', 'In progress', 'Awaiting', 'Resolved', 'Rejected', 'Incomplete'],
            default: 'Pending'
        },
        priority: {
            type: String,
            enum: ['High', 'Medium', 'Low'],
            default: 'Medium'
        },
        assignedStaff: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        materialsUsed: {
            type: String,
            trim: true,
        },
        resolutionNotes: {
            type: String,
            trim: true,
        },
        internalNotes: [{
            note: {
                type: String,
                required: true,
            },
            addedBy: {
                type: String,
                required: true,
            },
            role: {
                type: String,
                required: true,
            },
            date: {
                type: Date,
                default: Date.now
            }
        }],
        timeline: [timelineSchema]
    },
    {
        timestamps: true,
    }
);

complaintSchema.index({ studentId: 1 });
complaintSchema.index({ hostelId: 1 });
complaintSchema.index({ organizationId: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ status: 1 });

export default mongoose.model("Complaint", complaintSchema);
