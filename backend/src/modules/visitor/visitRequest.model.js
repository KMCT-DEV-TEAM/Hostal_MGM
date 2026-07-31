import mongoose from 'mongoose';
import { VISITOR_STATUS_VALUES, VISITOR_STATUS, VISITOR_APPROVAL_ACTION_VALUES } from './visitor.constant.js';

const approvalTimelineSchema = new mongoose.Schema(
    {
        action: {
            type: String,
            enum: VISITOR_APPROVAL_ACTION_VALUES,
            required: true
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        remarks: {
            type: String,
            trim: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    { _id: false }
);

const visitRequestSchema = new mongoose.Schema(
    {
        visitorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Visitor',
            required: true
        },
        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Parent'  // was incorrectly 'StudentParent' (junction table, not parent)
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: true
        },
        relationship: {
            type: String,
            required: true,
            trim: true
        },
        purpose: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 255
        },
        status: {
            type: String,
            enum: VISITOR_STATUS_VALUES,
            default: VISITOR_STATUS.PENDING
        },
        remarks: {
            type: String,
            trim: true
        },
        approvalTimeline: [approvalTimelineSchema]
    },
    {
        timestamps: true
    }
);

visitRequestSchema.index({ visitorId: 1 });
visitRequestSchema.index({ studentId: 1 });
visitRequestSchema.index({ status: 1 });
visitRequestSchema.index({ visitorId: 1, studentId: 1, status: 1 });

visitRequestSchema.index({ parentId: 1, visitorId: 1 });
visitRequestSchema.index({ visitorId: 1, parentId: 1 });

export default mongoose.model('VisitRequest', visitRequestSchema);
