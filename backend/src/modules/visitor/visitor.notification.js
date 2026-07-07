export default {
    VISITOR_CREATED: {
        admin: {
            "in-app": {
                title: 'New Visitor Request',
                message: '{{parentName}} has registered a new visitor ({{visitorName}}) for {{studentNames}}.'
            },
            push: {
                title: 'New Visitor Request',
                body: '{{parentName}} has registered a new visitor ({{visitorName}}) for {{studentNames}}.'
            },
            email: {
                subject: 'New Visitor Registration Request',
                html: '<h1>New Visitor Request</h1><p><strong>{{parentName}}</strong> has registered a new visitor named <strong>{{visitorName}}</strong> for student(s): <strong>{{studentNames}}</strong>.</p><p>Please review this request in the admin portal.</p>'
            }
        },
        warden: {
            "in-app": {
                title: 'New Visitor Request',
                message: '{{parentName}} has registered a new visitor ({{visitorName}}) for {{studentNames}}.'
            }
        }
    },

    VISITOR_APPROVED: {
        parent: {
            "in-app": {
                title: 'Visitor Approved',
                message: 'Your visitor registration for {{visitorName}} to visit {{studentNames}} has been approved.'
            },
            push: {
                title: 'Visitor Approved',
                body: 'Your visitor registration for {{visitorName}} to visit {{studentNames}} has been approved.'
            },
            email: {
                subject: 'Visitor Registration Approved',
                html: '<h1>Visitor Approved</h1><p>Your visitor registration for <strong>{{visitorName}}</strong> to visit <strong>{{studentNames}}</strong> has been approved by the hostel administration.</p>'
            }
        }
    },

    VISITOR_REJECTED: {
        parent: {
            "in-app": {
                title: 'Visitor Rejected',
                message: 'Your visitor registration for {{visitorName}} was rejected. Reason: {{reason}}'
            },
            push: {
                title: 'Visitor Rejected',
                body: 'Your visitor registration for {{visitorName}} was rejected. Reason: {{reason}}'
            },
            email: {
                subject: 'Visitor Registration Rejected',
                html: '<h1>Visitor Rejected</h1><p>Your visitor registration for <strong>{{visitorName}}</strong> has been rejected.</p><p><strong>Reason:</strong> {{reason}}</p>'
            }
        }
    },

    VISIT_CHECKED_IN: {
        parent: {
            "in-app": {
                title: 'Visitor Checked In',
                message: '{{visitorName}} checked in to visit {{studentNames}}.'
            },
            push: {
                title: 'Visitor Checked In',
                body: '{{visitorName}} checked in to visit {{studentNames}}.'
            },
            email: {
                subject: 'Visitor Checked In',
                html: '<h1>Visitor Checked In</h1><p><strong>{{visitorName}}</strong> has checked into the hostel to visit <strong>{{studentNames}}</strong>.</p>'
            }
        },
        student: {
            "in-app": {
                title: 'Visitor Checked In',
                message: '{{visitorName}} checked in to visit you.'
            },
            push: {
                title: 'Visitor Checked In',
                body: '{{visitorName}} checked in to visit you.'
            },
            email: {
                subject: 'Visitor Checked In',
                html: '<h1>Visitor Checked In</h1><p><strong>{{visitorName}}</strong> has checked into the hostel to visit you.</p>'
            }
        }
    }
};
