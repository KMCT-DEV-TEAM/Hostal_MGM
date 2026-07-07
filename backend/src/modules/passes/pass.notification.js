export default {
    PASS_CREATED: {
        student: {
            "in-app": {
                title: "Pass Request Received",
                message: "Your {{passTypeLabel}} request has been successfully submitted and is currently pending approval from your parent/guardian.",
                type: "info"
            },
            push: {
                title: "Pass Request Submitted",
                body: "Your {{passTypeLabel}} request was successfully submitted and is waiting for parent approval."
            },
            email: {
                subject: "Your Pass Request has been successfully submitted",
                html: `
                    <p>Hello <strong>{{studentName}}</strong>,</p>
                    <p>Your <strong>{{passTypeLabel}}</strong> request has been submitted successfully.</p>
                    <p>It is currently awaiting approval from your parent/guardian.</p>
                    <p><strong>Reason:</strong> {{reason}}</p>
                    <br/>
                    <p>We will notify you once they take action.</p>
                `
            }
        },
        parent: {
            "in-app": {
                title: "New Pass Request from {{studentName}}",
                message: "Your ward, {{studentName}}, has requested a {{passTypeLabel}}. Please review and take action."
            },
            push: {
                title: "Action Required: New Pass Request",
                body: "Your ward, {{studentName}}, has submitted a {{passTypeLabel}} request awaiting your approval."
            },
            email: {
                subject: "Action Required: Pass Request Submitted by {{studentName}}",
                html: `
                    <p>Hello,</p>
                    <p>Your ward, <strong>{{studentName}}</strong>, has submitted a <strong>{{passTypeLabel}}</strong> request.</p>
                    <p><strong>Reason:</strong> {{reason}}</p>
                    <br/>
                    <p>Please log in to the application to review and approve or decline this request.</p>
                `
            }
        },
        admin: {
            "in-app": {
                title: "New Pass Request",
                message: "{{studentName}} has submitted a new {{passTypeLabel}} request for review."
            }
        },
        warden: {
            "in-app": {
                title: "New Pass Request",
                message: "{{studentName}} has submitted a new {{passTypeLabel}} request for review."
            }
        }
    },

    PASS_PARENT_APPROVED: {
        student: {
            "in-app": {
                title: "Pass Request Approved by Parent",
                message: "Great news! Your {{passTypeLabel}} request has been approved by your parent ({{parentName}}). It is now pending final approval from the administration."
            },
            push: {
                title: "Pass Approved by Parent",
                body: "Your {{passTypeLabel}} request has been approved by your parent and forwarded to the administration."
            },
            email: {
                subject: "Update: Parent Approved Your Pass Request",
                html: `
                    <p>Hello <strong>{{studentName}}</strong>,</p>
                    <p>Good news! Your parent/guardian, <strong>{{parentName}}</strong>, has approved your pass request.</p>
                    <p>The request is now waiting for final administration approval.</p>
                    <br/>
                    <p>You will receive a notification once the final decision is made.</p>
                `
            }
        },
        parent: {
            "in-app": {
                title: "Pass Approved",
                message: "You have successfully approved the {{passTypeLabel}} request for {{studentName}}. It has been forwarded to the administration."
            }
        },
        admin: {
            "in-app": {
                title: "Pass Ready for Final Approval",
                message: "Parent ({{parentName}}) has approved the {{passTypeLabel}} request for {{studentName}}. It now requires your final approval."
            }
        },
        warden: {
            "in-app": {
                title: "Pass Ready for Final Approval",
                message: "Parent ({{parentName}}) has approved the {{passTypeLabel}} request for {{studentName}}. It now requires your final approval."
            }
        }
    },

    PASS_ADMIN_APPROVED: {
        student: {
            "in-app": {
                title: "Pass Request Officially Approved!",
                message: "Your {{passTypeLabel}} request has been officially approved by {{approvedBy}}. Have a safe trip!"
            },
            push: {
                title: "Pass Officially Approved",
                body: "Your {{passTypeLabel}} request has been officially approved. Have a safe trip!"
            },
            email: {
                subject: "Success: Your Pass Request is Approved!",
                html: `
                    <p>Hello <strong>{{studentName}}</strong>,</p>
                    <p>Great news! Your pass request has been officially approved by <strong>{{approvedBy}}</strong>.</p>
                    <p><strong>Remarks:</strong> {{remarks}}</p>
                    <br/>
                    <p>Wishing you a safe and pleasant journey!</p>
                `
            }
        },
        parent: {
            "in-app": {
                title: "Pass Request Approved",
                message: "The administration ({{approvedBy}}) has officially approved the {{passTypeLabel}} request for {{studentName}}."
            }
        },
        admin: {
            "in-app": {
                title: "Pass Approved",
                message: "You have successfully approved the {{passTypeLabel}} request for {{studentName}}."
            }
        },
        warden: {
            "in-app": {
                title: "Pass Approved",
                message: "The administration ({{approvedBy}}) has officially approved the {{passTypeLabel}} request for {{studentName}}."
            }
        }
    },

    PASS_ADMIN_REJECTED: {
        student: {
            "in-app": {
                title: "Pass Request Declined",
                message: "Unfortunately, your {{passTypeLabel}} request was declined by the administration ({{approvedBy}}). Please check the remarks for details."
            },
            push: {
                title: "Pass Request Declined",
                body: "Your {{passTypeLabel}} request was declined by the administration. Check the app for remarks."
            },
            email: {
                subject: "Update: Pass Request Declined",
                html: `
                    <p>Hello <strong>{{studentName}}</strong>,</p>
                    <p>We regret to inform you that your pass request was declined by the administration.</p>
                    <p><strong>Reason for decline:</strong> {{remarks}}</p>
                    <br/>
                    <p>If you have any questions, please contact the administration office.</p>
                `
            }
        },
        parent: {
            "in-app": {
                title: "Pass Request Declined",
                message: "The administration ({{approvedBy}}) has declined the {{passTypeLabel}} request for {{studentName}}."
            }
        },
        admin: {
            "in-app": {
                title: "Pass Declined",
                message: "You have declined the {{passTypeLabel}} request for {{studentName}}."
            }
        },
        warden: {
            "in-app": {
                title: "Pass Request Declined",
                message: "The administration ({{approvedBy}}) has declined the {{passTypeLabel}} request for {{studentName}}."
            }
        }
    },

    PASS_PARENT_REJECTED: {
        student: {
            "in-app": {
                title: "Pass Request Declined by Parent",
                message: "Your {{passTypeLabel}} request was declined by your parent ({{parentName}}). Please check with them for further details."
            },
            push: {
                title: "Pass Declined by Parent",
                body: "Your {{passTypeLabel}} request was declined by your parent/guardian."
            },
            email: {
                subject: "Update: Pass Request Declined by Parent",
                html: `
                    <p>Hello <strong>{{studentName}}</strong>,</p>
                    <p>Your pass request was declined by your parent/guardian (<strong>{{parentName}}</strong>).</p>
                    <p><strong>Remarks:</strong> {{remarks}}</p>
                    <br/>
                    <p>Please reach out to them if you need more details.</p>
                `
            }
        },
        parent: {
            "in-app": {
                title: "Pass Declined",
                message: "You have successfully declined the {{passTypeLabel}} request for {{studentName}}."
            }
        },
        admin: {
            "in-app": {
                title: "Pass Request Declined",
                message: "Parent ({{parentName}}) has declined the {{passTypeLabel}} request for {{studentName}}."
            }
        },
        warden: {
            "in-app": {
                title: "Pass Request Declined",
                message: "Parent ({{parentName}}) has declined the {{passTypeLabel}} request for {{studentName}}."
            }
        }
    }
};
