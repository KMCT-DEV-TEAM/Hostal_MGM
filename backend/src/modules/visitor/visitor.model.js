import mongoose from 'mongoose';
import {
    VISITOR_STATUS_VALUES,
    VISITOR_APPROVAL_ACTION_VALUES,
    ID_PROOF_TYPE_VALUES,
    VISITOR_STATUS
} from './visitor.constant.js';

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

const visitorSchema = new mongoose.Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        relationship: {
            type: String,
            required: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true
        },
        idProofType: {
            type: String,
            enum: ID_PROOF_TYPE_VALUES,
            required: true
        },
        idProofNumber: {
            type: String,
            required: true,
            trim: true
        },
        address: {
            type: String,
            trim: true
        },
        photoUrl: {
            type: String,
            trim: true
        },
        students: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Student',
                required: true
            }
        ],
        approvalStatus: {
            type: String,
            enum: VISITOR_STATUS_VALUES,
            default: VISITOR_STATUS.PENDING
        },
        approvalTimeline: [approvalTimelineSchema]
    },
    {
        timestamps: true
    }
);

// Indexes matching user requirements (organizationId, phone, student reference, status)
visitorSchema.index({ organizationId: 1 });
visitorSchema.index({ email: 1 });
visitorSchema.index({ students: 1 });
visitorSchema.index({ approvalStatus: 1 });
visitorSchema.index({ organizationId: 1, email: 1 }, { unique: true });

export default mongoose.model('Visitor', visitorSchema);
