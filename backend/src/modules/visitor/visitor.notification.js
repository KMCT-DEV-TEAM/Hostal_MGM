export default {
    VISITOR_CREATED: {
        admin: {
            'in-app': {
                title: "New Visitor Registration",
                message: "{{parentName}} registered {{visitorName}} for {{studentNames}}.",
                type: "info"
            },
            'push': {
                title: "New Visitor Registration",
                body: "{{parentName}} registered {{visitorName}} for {{studentNames}}."
            },
            'email': {
                subject: "New Visitor Registration",
                body: "Hello,\n\n{{parentName}} registered {{visitorName}} for {{studentNames}}.\n\nPlease review the new visitor registration in the admin dashboard.",
                html: "<p>Hello,</p><p><strong>{{parentName}}</strong> registered <strong>{{visitorName}}</strong> for <strong>{{studentNames}}</strong>.</p><p>Please review the new visitor registration in the admin dashboard.</p>"
            }
        }
    },
    VISITOR_APPROVED: {
        parent: {
            'in-app': {
                title: "Visitor Approved",
                message: "Your visitor {{visitorName}} has been approved and is now eligible to visit {{studentNames}}.",
                type: "success"
            },
            'push': {
                title: "Visitor Approved",
                body: "Your visitor {{visitorName}} has been approved and is now eligible to visit {{studentNames}}."
            },
            'email': {
                subject: "Visitor Approved",
                body: "Hello,\n\nYour visitor {{visitorName}} has been approved and is now eligible to visit {{studentNames}}.",
                html: "<p>Hello,</p><p>Your visitor <strong>{{visitorName}}</strong> has been approved and is now eligible to visit <strong>{{studentNames}}</strong>.</p>"
            }
        }
    },
    VISITOR_REJECTED: {
        parent: {
            'in-app': {
                title: "Visitor Registration Rejected",
                message: "Your visitor {{visitorName}} has been rejected.\nReason: {{reason}}",
                type: "error"
            },
            'push': {
                title: "Visitor Registration Rejected",
                body: "Your visitor {{visitorName}} has been rejected.\nReason: {{reason}}"
            },
            'email': {
                subject: "Visitor Registration Rejected",
                body: "Hello,\n\nYour visitor {{visitorName}} has been rejected.\nReason: {{reason}}",
                html: "<p>Hello,</p><p>Your visitor <strong>{{visitorName}}</strong> has been rejected.</p><p><strong>Reason:</strong> {{reason}}</p>"
            }
        }
    }
};
