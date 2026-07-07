import mongoose from 'mongoose';
import {
    VISITOR_VISIT_STATUS_VALUES,
    VISITOR_VISIT_TIMELINE_ACTION_VALUES,
    VISITOR_VISIT_STATUS
} from './visitor.constant.js';

const visitTimelineSchema = new mongoose.Schema(
    {
        action: {
            type: String,
            enum: VISITOR_VISIT_TIMELINE_ACTION_VALUES,
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

const visitorVisitSchema = new mongoose.Schema(
    {
        visitorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Visitor',
            required: true
        },
        hostelId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Hostel',
            required: true
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            required: true
        },
        status: {
            type: String,
            enum: VISITOR_VISIT_STATUS_VALUES,
            default: VISITOR_VISIT_STATUS.CHECKED_IN
        },
        checkInTime: {
            type: Date,
            required: true
        },
        expectedExitTime: {
            type: Date,
            required: true
        },
        checkOutTime: {
            type: Date
        },
        checkedInBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        checkedOutBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        visitTimeline: [visitTimelineSchema]
    },
    {
        timestamps: true
    }
);

// Indexes matching user requirements (organizationId, hostelId, status, visitor reference)
visitorVisitSchema.index({ organizationId: 1 });
visitorVisitSchema.index({ hostelId: 1 });
visitorVisitSchema.index({ visitorId: 1 });
visitorVisitSchema.index({ status: 1 });

export default mongoose.model('VisitorVisit', visitorVisitSchema);
