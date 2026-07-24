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
            },
            push: {
                title: "New Pass Request",
                body: "{{studentName}} has submitted a new {{passTypeLabel}} request for review."
            }
        },
        warden: {
            "in-app": {
                title: "New Pass Request",
                message: "{{studentName}} has submitted a new {{passTypeLabel}} request for review."
            },
            push: {
                title: "New Pass Request",
                body: "{{studentName}} has submitted a new {{passTypeLabel}} request for review."
            }
        },
        mentor: {
            "in-app": {
                title: "New Pass Request",
                message: "{{studentName}} has submitted a new {{passTypeLabel}} request for review."
            },
            push: {
                title: "New Pass Request",
                body: "{{studentName}} has submitted a new {{passTypeLabel}} request for review."
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
            },
            push: {
                title: "Pass Ready for Final Approval",
                body: "Parent ({{parentName}}) has approved the {{passTypeLabel}} request for {{studentName}}."
            }
        },
        warden: {
            "in-app": {
                title: "Pass Ready for Final Approval",
                message: "Parent ({{parentName}}) has approved the {{passTypeLabel}} request for {{studentName}}. It now requires your final approval."
            },
            push: {
                title: "Pass Ready for Final Approval",
                body: "Parent ({{parentName}}) has approved the {{passTypeLabel}} request for {{studentName}}."
            }
        },
        mentor: {
            "in-app": {
                title: "Pass Ready for Final Approval",
                message: "Parent ({{parentName}}) has approved the {{passTypeLabel}} request for {{studentName}}. It now requires your final approval."
            },
            push: {
                title: "Pass Ready for Final Approval",
                body: "Parent ({{parentName}}) has approved the {{passTypeLabel}} request for {{studentName}}."
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
            },
            push: {
                title: "Pass Approved",
                body: "The pass request for {{studentName}} has been approved."
            }
        },
        warden: {
            "in-app": {
                title: "Pass Approved",
                message: "The administration ({{approvedBy}}) has officially approved the {{passTypeLabel}} request for {{studentName}}."
            },
            push: {
                title: "Pass Approved",
                body: "The pass request for {{studentName}} has been approved."
            }
        },
        mentor: {
            "in-app": {
                title: "Pass Approved",
                message: "The pass request for {{studentName}} has been officially approved."
            },
            push: {
                title: "Pass Approved",
                body: "The pass request for {{studentName}} has been approved."
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
            },
            push: {
                title: "Pass Request Declined",
                body: "The pass request for {{studentName}} has been declined."
            }
        },
        warden: {
            "in-app": {
                title: "Pass Request Declined",
                message: "The administration ({{approvedBy}}) has declined the {{passTypeLabel}} request for {{studentName}}."
            },
            push: {
                title: "Pass Request Declined",
                body: "The pass request for {{studentName}} has been declined."
            }
        },
        mentor: {
            "in-app": {
                title: "Pass Request Declined",
                message: "The pass request for {{studentName}} has been declined."
            },
            push: {
                title: "Pass Request Declined",
                body: "The pass request for {{studentName}} has been declined."
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
            },
            push: {
                title: "Pass Request Declined",
                body: "Parent ({{parentName}}) has declined the {{passTypeLabel}} request for {{studentName}}."
            }
        },
        warden: {
            "in-app": {
                title: "Pass Request Declined",
                message: "Parent ({{parentName}}) has declined the {{passTypeLabel}} request for {{studentName}}."
            },
            push: {
                title: "Pass Request Declined",
                body: "Parent ({{parentName}}) has declined the {{passTypeLabel}} request for {{studentName}}."
            }
        },
        mentor: {
            "in-app": {
                title: "Pass Request Declined",
                message: "Parent ({{parentName}}) has declined the {{passTypeLabel}} request for {{studentName}}."
            },
            push: {
                title: "Pass Request Declined",
                body: "Parent ({{parentName}}) has declined the {{passTypeLabel}} request for {{studentName}}."
            }
        }
    },

    PASS_MODIFIED: {
        parent: {
            "in-app": {
                title: "Pass Request Modified",
                message: "A pass request for {{studentName}} was updated. {{message}}"
            },
            push: {
                title: "Pass Request Modified",
                body: "A pass request for {{studentName}} was updated."
            },
            email: {
                subject: "Update: Pass Request Modified",
                html: `
                    <p>Hello,</p>
                    <p>A pass request for <strong>{{studentName}}</strong> has been updated.</p>
                    <br/>
                    <p>Please log in to the application to review the changes.</p>
                `
            }
        },
        admin: {
            "in-app": {
                title: "Pass Request Modified",
                message: "A pass request for {{studentName}} was updated."
            },
            push: {
                title: "Pass Request Modified",
                body: "A pass request for {{studentName}} was updated."
            }
        },
        warden: {
            "in-app": {
                title: "Pass Request Modified",
                message: "A pass request for {{studentName}} was updated."
            },
            push: {
                title: "Pass Request Modified",
                body: "A pass request for {{studentName}} was updated."
            }
        },
        mentor: {
            "in-app": {
                title: "Pass Request Modified",
                message: "A pass request for {{studentName}} was updated."
            },
            push: {
                title: "Pass Request Modified",
                body: "A pass request for {{studentName}} was updated."
            }
        }
    },

    PASS_ADMIN_CANCELLED: {
        student: {
            "in-app": {
                title: "Pass Cancelled by Administration",
                message: "Your pass has been cancelled by administration. Reason: {{reason}}"
            },
            push: {
                title: "Pass Cancelled",
                body: "Your pass was cancelled by administration. Reason: {{reason}}"
            },
            email: {
                subject: "Alert: Your Pass has been Cancelled",
                html: `
                    <p>Hello,</p>
                    <p>We need to inform you that your pass has been cancelled by the administration.</p>
                    <p><strong>Reason:</strong> {{reason}}</p>
                `
            }
        },
        parent: {
            "in-app": {
                title: "Pass Cancelled by Administration",
                message: "A pass for {{studentName}} has been cancelled by administration. Reason: {{reason}}"
            },
            email: {
                subject: "Alert: Ward's Pass Cancelled",
                html: `
                    <p>Hello,</p>
                    <p>A pass for your ward, <strong>{{studentName}}</strong>, has been cancelled by the administration.</p>
                    <p><strong>Reason:</strong> {{reason}}</p>
                `
            }
        },
        mentor: {
            "in-app": {
                title: "Pass Cancelled by Administration",
                message: "A pass for {{studentName}} has been cancelled by administration. Reason: {{reason}}"
            },
            push: {
                title: "Pass Cancelled by Administration",
                body: "A pass for {{studentName}} has been cancelled by administration."
            }
        }
    },

    WARDEN_MARKED_OUT: {
        student: {
            "in-app": {
                title: "Hostel Exit Registered",
                message: "{{message}}"
            },
            push: {
                title: "Hostel Exit",
                body: "You have been marked as left the hostel. Have a safe trip!"
            }
        }
    },

    WARDEN_MARKED_RETURNED: {
        student: {
            "in-app": {
                title: "Hostel Return Registered",
                message: "{{message}}"
            },
            push: {
                title: "Hostel Return",
                body: "{{message}}"
            }
        }
    }
};
