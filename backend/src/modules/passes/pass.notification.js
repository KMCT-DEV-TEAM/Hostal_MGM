export default {
    PASS_CREATED: {
        student: {
            "in-app": {
                title: "Pass Request Submitted",
                message: "Your {{passTypeLabel}} request has been submitted successfully and is awaiting approval.",
                type: "info"
            },
            push: {
                title: "Pass Request Submitted",
                body: "Your {{passTypeLabel}} request has been submitted."
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
        parent: {
            "in-app": {
                title: "Pass Request Submitted",
                message: "{{studentName}} has submitted a {{passTypeLabel}} request."
            },
            push: {
                title: "Pass Request Submitted",
                body: "{{studentName}} has submitted a {{passTypeLabel}} request."
            },
            email: {
                subject: "Pass Request Submitted by Student",
                html: `
                    <p>Hello,</p>
                    <p>{{studentName}} has submitted a <strong>{{passTypeLabel}}</strong> request.</p>
                    <p>Reason: {{reason}}</p>
                `
            }
        },
        admin: {
            "in-app": {
                title: "New Pass Request",
                message: "{{studentName}} submitted a {{passTypeLabel}} request."
            }
        },
        warden: {
            "in-app": {
                title: "New Pass Request",
                message: "{{studentName}} submitted a {{passTypeLabel}} request."
            }
        }
    },

    PASS_PARENT_APPROVED: {
        student: {
            "in-app": {
                title: "Parent Approved",
                message: "{{parentName}} approved your {{passTypeLabel}} request."
            },
            push: {
                title: "Parent Approved",
                body: "{{parentName}} approved your {{passTypeLabel}} request."
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
        parent: {
            "in-app": {
                title: "Pass Approved",
                message: "You have approved {{studentName}}'s {{passTypeLabel}} request."
            }
        },
        admin: {
            "in-app": {
                title: "Parent Approved",
                message: "Parent ({{parentName}}) approved {{studentName}}'s {{passTypeLabel}} request."
            }
        },
        warden: {
            "in-app": {
                title: "Parent Approved",
                message: "Parent ({{parentName}}) approved {{studentName}}'s {{passTypeLabel}} request."
            }
        }
    },

    PASS_ADMIN_APPROVED: {
        student: {
            "in-app": {
                title: "Pass Approved",
                message: "Your {{passTypeLabel}} request has been approved by {{approvedBy}}."
            },
            push: {
                title: "Pass Approved",
                body: "Your {{passTypeLabel}} request has been approved by {{approvedBy}}."
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
        parent: {
            "in-app": {
                title: "Pass Approved",
                message: "{{studentName}}'s {{passTypeLabel}} request has been approved by {{approvedBy}}."
            }
        },
        admin: {
            "in-app": {
                title: "Pass Approved",
                message: "You approved {{studentName}}'s {{passTypeLabel}} request."
            }
        },
        warden: {
            "in-app": {
                title: "Pass Approved",
                message: "{{studentName}}'s {{passTypeLabel}} request has been approved by {{approvedBy}}."
            }
        }
    },

    PASS_ADMIN_REJECTED: {
        student: {
            "in-app": {
                title: "Pass Rejected",
                message: "Your {{passTypeLabel}} request was rejected by {{approvedBy}}."
            },
            push: {
                title: "Pass Rejected",
                body: "Your {{passTypeLabel}} request was rejected by {{approvedBy}}."
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
        parent: {
            "in-app": {
                title: "Pass Rejected",
                message: "{{studentName}}'s {{passTypeLabel}} request was rejected by {{approvedBy}}."
            }
        },
        admin: {
            "in-app": {
                title: "Pass Rejected",
                message: "You rejected {{studentName}}'s {{passTypeLabel}} request."
            }
        },
        warden: {
            "in-app": {
                title: "Pass Rejected",
                message: "{{studentName}}'s {{passTypeLabel}} request was rejected by {{approvedBy}}."
            }
        }
    },

    PASS_PARENT_REJECTED: {
        student: {
            "in-app": {
                title: "Parent Rejected",
                message: "Your {{passTypeLabel}} request was rejected by {{parentName}}."
            },
            push: {
                title: "Parent Rejected",
                body: "Your {{passTypeLabel}} request was rejected by {{parentName}}."
            },
            email: {
                subject: "Pass Rejected by Parent",
                html: `
                    <p>Hello {{studentName}},</p>
                    <p>Your pass request was rejected by your parent/guardian ({{parentName}}).</p>
                    <p>Remarks: {{remarks}}</p>
                `
            }
        },
        parent: {
            "in-app": {
                title: "Pass Rejected",
                message: "You rejected {{studentName}}'s {{passTypeLabel}} request."
            }
        },
        admin: {
            "in-app": {
                title: "Parent Rejected",
                message: "Parent ({{parentName}}) rejected {{studentName}}'s {{passTypeLabel}} request."
            }
        },
        warden: {
            "in-app": {
                title: "Parent Rejected",
                message: "Parent ({{parentName}}) rejected {{studentName}}'s {{passTypeLabel}} request."
            }
        }
    }
};
