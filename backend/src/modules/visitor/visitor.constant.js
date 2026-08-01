export const VISITOR_STATUS = {
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    REVOKED: 'Revoked',
    INACTIVE: 'Inactive'
};

export const VISITOR_APPROVAL_ACTIONS = {
    CREATED: 'Created',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    REVOKED: 'Revoked',
    ACTIVATED: 'Activated',
    DEACTIVATED: 'Deactivated'
};

export const VISITOR_VISIT_STATUS = {
    CHECKED_IN: 'Checked In',
    CHECKED_OUT: 'Checked Out',
    EXTENDED: 'Extended',
    OVERSTAYED: 'Overstayed',
    COMPLETED: 'Completed'
};

export const VISITOR_VISIT_TIMELINE_ACTIONS = {
    CHECKED_IN: 'Checked In',
    STUDENT_ADDED: 'Student Added',
    PURPOSE_UPDATED: 'Purpose Updated',
    DURATION_EXTENDED: 'Duration Extended',
    OVERSTAYED: 'Overstayed',
    CHECKED_OUT: 'Checked Out',
    AUTO_CHECKED_OUT: 'Auto Checked Out'
};

export const ID_PROOF_TYPES = {
    AADHAAR: 'Aadhaar',
    PAN_CARD: 'PAN Card',
    VOTER_ID: 'Voter ID',
    DRIVING_LICENSE: 'Driving License',
    PASSPORT: 'Passport',
    OTHER: 'Other'
};

// ── Visitor Profile Status ─────────────────────────────────────────────────────
// Replaces the legacy `isActive: Boolean` field.
// Four states cover every lifecycle scenario without over-engineering.
export const VISITOR_PROFILE_STATUS = {
    ACTIVE: 'Active',       // Normal; can receive new VisitRequests
    INACTIVE: 'Inactive',     // Temporarily blocked; Admin can reactivate
    BLACKLISTED: 'Blacklisted',  // Permanent security block; Super Admin only to lift
    DELETED: 'Deleted'       // Soft deleted; hidden from all listings; history preserved
};

// ── Visitor Change Log Actions ─────────────────────────────────────────────────
// Audit trail entries recorded on Visitor.changeLog for every profile mutation.
export const VISITOR_CHANGE_LOG_ACTIONS = {
    CREATED: 'Created',
    UPDATED: 'Updated',
    DEACTIVATED: 'Deactivated',
    REACTIVATED: 'Reactivated',
    BLACKLISTED: 'Blacklisted',
    BLACKLIST_LIFTED: 'Blacklist Lifted',
    SOFT_DELETED: 'Soft Deleted',
    RESTORED: 'Restored'
};

export const VISITOR_STATUS_VALUES = Object.values(VISITOR_STATUS);
export const VISITOR_APPROVAL_ACTION_VALUES = Object.values(VISITOR_APPROVAL_ACTIONS);
export const VISITOR_VISIT_STATUS_VALUES = Object.values(VISITOR_VISIT_STATUS);
export const VISITOR_VISIT_TIMELINE_ACTION_VALUES = Object.values(VISITOR_VISIT_TIMELINE_ACTIONS);
export const ID_PROOF_TYPE_VALUES = Object.values(ID_PROOF_TYPES);
export const VISITOR_PROFILE_STATUS_VALUES = Object.values(VISITOR_PROFILE_STATUS);
export const VISITOR_CHANGE_LOG_ACTION_VALUES = Object.values(VISITOR_CHANGE_LOG_ACTIONS);

