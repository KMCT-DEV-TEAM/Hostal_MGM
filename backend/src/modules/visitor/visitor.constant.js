export const VISITOR_STATUS = {
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    INACTIVE: 'Inactive'
};

export const VISITOR_APPROVAL_ACTIONS = {
    CREATED: 'Created',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    ACTIVATED: 'Activated',
    DEACTIVATED: 'Deactivated'
};

export const VISITOR_VISIT_STATUS = {
    CHECKED_IN: 'Checked In',
    CHECKED_OUT: 'Checked Out',
    EXTENDED: 'Extended',
    OVERSTAYED: 'Overstayed'
};

export const VISITOR_VISIT_TIMELINE_ACTIONS = {
    CHECKED_IN: 'Checked In',
    DURATION_EXTENDED: 'Duration Extended',
    OVERSTAYED: 'Overstayed',
    CHECKED_OUT: 'Checked Out'
};

export const ID_PROOF_TYPES = {
    AADHAAR: 'Aadhaar',
    PAN_CARD: 'PAN Card',
    VOTER_ID: 'Voter ID',
    DRIVING_LICENSE: 'Driving License',
    PASSPORT: 'Passport',
    OTHER: 'Other'
};

// Extracted value arrays for Mongoose enums
export const VISITOR_STATUS_VALUES = Object.values(VISITOR_STATUS);
export const VISITOR_APPROVAL_ACTION_VALUES = Object.values(VISITOR_APPROVAL_ACTIONS);
export const VISITOR_VISIT_STATUS_VALUES = Object.values(VISITOR_VISIT_STATUS);
export const VISITOR_VISIT_TIMELINE_ACTION_VALUES = Object.values(VISITOR_VISIT_TIMELINE_ACTIONS);
export const ID_PROOF_TYPE_VALUES = Object.values(ID_PROOF_TYPES);
