import mongoose from 'mongoose';
import {
    ID_PROOF_TYPE_VALUES,
    VISITOR_PROFILE_STATUS,
    VISITOR_PROFILE_STATUS_VALUES,
    VISITOR_CHANGE_LOG_ACTION_VALUES
} from './visitor.constant.js';

// ── Change Log Entry ──────────────────────────────────────────────────────────
// Immutable audit trail entry. Every status change and profile mutation
// appends one entry here. Entries are never modified or deleted.
const changeLogEntrySchema = new mongoose.Schema(
    {
        action: {
            type: String,
            enum: VISITOR_CHANGE_LOG_ACTION_VALUES,
            required: true
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        performedByRole: {
            type: String,
            enum: ['parent', 'admin', 'super-admin'],
            required: true
        },
        reason: {
            type: String,
            trim: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    },
    { _id: false }
);

// ── Visitor Schema ────────────────────────────────────────────────────────────
// Visitor represents a real-world person — a shared, reusable identity record.
// It does NOT belong to any organization, hostel, or parent.
// Organization context is always derived from the Student in the VisitRequest.
const visitorSchema = new mongoose.Schema(
    {
        // ── Identity (immutable after creation — admin-only changes) ──────────
        name: {
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

        // ── Contact / Optional ────────────────────────────────────────────────
        address: {
            type: String,
            trim: true
        },
        photoUrl: {
            type: String,
            trim: true
        },

        // ── Lifecycle ─────────────────────────────────────────────────────────
        // Replaces the legacy `isActive: Boolean` field.
        // Valid transitions are enforced at the service layer.
        //   Active      → Inactive | Blacklisted | Deleted
        //   Inactive    → Active | Blacklisted | Deleted
        //   Blacklisted → Active (Super Admin only) | Deleted
        //   Deleted     → Active (Super Admin only — restore)
        status: {
            type: String,
            enum: VISITOR_PROFILE_STATUS_VALUES,
            default: VISITOR_PROFILE_STATUS.ACTIVE,
            required: true
        },

        // Soft delete timestamp. Set when status transitions to 'Deleted'.
        // null when the profile is not deleted.
        deletedAt: {
            type: Date,
            default: null
        },

        // ── Ownership (audit only — not an authorization gate) ────────────────
        // Tracks who originally introduced this visitor to the system.
        // Does NOT restrict who can edit. Admins own the profile.
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Parent',
            required: true
        },

        // ── Audit Trail ───────────────────────────────────────────────────────
        // Immutable log of all status changes and significant profile mutations.
        // Append-only. Entries are never modified or deleted.
        changeLog: {
            type: [changeLogEntrySchema],
            default: []
        }
    },
    {
        timestamps: true
    }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
//
// PRIMARY IDENTITY SIGNALS — globally unique indexes.
// Phone, Email, and ID Proof are all treated as identity vectors.
// A match on ANY of these will reuse the existing profile.

visitorSchema.index(
    { idProofType: 1, idProofNumber: 1 },
    { unique: true }
);

visitorSchema.index({ phone: 1 }, { unique: true });

visitorSchema.index({ email: 1 }, { unique: true, sparse: true });

// FUZZY SIGNAL + ADMIN SEARCH — name.
//   Supports case-insensitive name matching in potential-duplicate detection
//   and general admin search by visitor name.
visitorSchema.index({ name: 1 });

// STATUS FILTER — for admin dashboards filtering by Active/Inactive/etc.
visitorSchema.index({ status: 1 });

export default mongoose.model('Visitor', visitorSchema);
