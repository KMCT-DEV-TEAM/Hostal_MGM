export default {
    PASS_CREATED: {
        "in-app": {
            title: "Pass Request Submitted",
            message:
                "Your {{passTypeLabel}} request has been submitted successfully and is awaiting approval.",
            type: "info"
        },
        push: {
            title: "Pass Request Submitted",
            body:
                "Your {{passTypeLabel}} request has been submitted."
        },
        email: {
            subject: "Pass Request Submitted",
            html: `
                <p>Hello {{studentName}},</p>
                <p>Your <strong>{{passTypeLabel}}</strong> request has been submitted successfully.</p>
                <p>Reason: {{reason}}</p>
            `
        }
    },

    PASS_PARENT_APPROVED: {
        "in-app": {
            title: "Parent Approved",
            message:
                "{{parentName}} approved your {{passTypeLabel}} request."
        },
        push: {
            title: "Parent Approved",
            body:
                "{{parentName}} approved your {{passTypeLabel}} request."
        },
        email: {
            subject: "Parent Approved Your Pass",
            html: `
                <p>Hello {{studentName}},</p>
                <p>{{parentName}} approved your pass request.</p>
                <p>The request is now waiting for administration approval.</p>
            `
        }
    },

    PASS_ADMIN_APPROVED: {
        "in-app": {
            title: "Pass Approved",
            message:
                "Your {{passTypeLabel}} request has been approved by {{approvedBy}}."
        },
        push: {
            title: "Pass Approved",
            body:
                "Your {{passTypeLabel}} request has been approved by {{approvedBy}}."
        },
        email: {
            subject: "Pass Approved",
            html: `
                <p>Hello {{studentName}},</p>
                <p>Your pass request has been approved by {{approvedBy}}.</p>
                <p>Remarks: {{remarks}}</p>
            `
        }
    },

    PASS_ADMIN_REJECTED: {
        "in-app": {
            title: "Pass Rejected",
            message:
                "Your {{passTypeLabel}} request was rejected."
        },
        push: {
            title: "Pass Rejected",
            body:
                "Your {{passTypeLabel}} request was rejected by {{approvedBy}}"
        },
        email: {
            subject: "Pass Rejected",
            html: `
                <p>Hello {{studentName}},</p>
                <p>Your pass request was rejected.</p>
                <p>Reason: {{remarks}}</p>
            `
        }
    },

    PASS_PARENT_REJECTED: {
        "in-app": {
            title: "Parent Rejected",
            message:
                "Your {{passTypeLabel}} request was rejected by {{parentName}}."
        },
        push: {
            title: "Parent Rejected",
            body:
                "Your {{passTypeLabel}} request was rejected by {{parentName}}."
        },
        email: {
            subject: "Pass Rejected by Parent",
            html: `
                <p>Hello {{studentName}},</p>
                <p>Your pass request was rejected by your parent/guardian ({{parentName}}).</p>
                <p>Remarks: {{remarks}}</p>
            `
        }
    }
};
