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
            ref: 'User'
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
        visitor: {
            refId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                refPath: 'visitor.refType'
            },
            refType: {
                type: String,
                required: true,
                enum: ['Parent', 'Visitor']
            }
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
        students: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Student',
                required: true
            }
        ],
        purpose: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 255
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

visitorVisitSchema.index({ organizationId: 1 });
visitorVisitSchema.index({ hostelId: 1 });
visitorVisitSchema.index({ students: 1 });
visitorVisitSchema.index({ 'visitor.refId': 1, 'visitor.refType': 1 });
visitorVisitSchema.index(
    { 'visitor.refId': 1, 'visitor.refType': 1, status: 1 },
    {
        unique: true,
        partialFilterExpression: { status: 'Checked In' }
    }
);

export default mongoose.model('VisitorVisit', visitorVisitSchema);
