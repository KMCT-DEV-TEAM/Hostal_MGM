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
        },
        mentor: {
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
                html: '<h1>New Visitor Request</h1><p><strong>{{parentName}}</strong> has registered a new visitor named <strong>{{visitorName}}</strong> for student(s): <strong>{{studentNames}}</strong>.</p><p>Please review this request in the portal.</p>'
            }
        }
    },

    VISITOR_UPDATE_PENDING: {
        admin: {
            "in-app": {
                title: 'Visitor Update Needs Approval',
                message: '{{visitorName}} has updated sensitive information ({{updatedFields}}) for student(s): {{studentNames}}. Please review and approve.'
            },
            push: {
                title: 'Visitor Update Needs Approval',
                body: '{{visitorName}} has updated sensitive information ({{updatedFields}}) for student(s): {{studentNames}}. Please review and approve.'
            },
            email: {
                subject: 'Visitor Update Needs Approval',
                html: '<h1>Visitor Update Needs Approval</h1><p><strong>{{visitorName}}</strong> has updated sensitive information (<strong>{{updatedFields}}</strong>) for student(s): <strong>{{studentNames}}</strong>.</p><p>Please review this update in the admin portal.</p>'
            }
        },
        warden: {
            "in-app": {
                title: 'Visitor Update Needs Approval',
                message: '{{visitorName}} has updated sensitive information ({{updatedFields}}) for student(s): {{studentNames}}.'
            }
        },
        mentor: {
            "in-app": {
                title: 'Visitor Update Needs Approval',
                message: '{{visitorName}} has updated sensitive information ({{updatedFields}}) for student(s): {{studentNames}}. Please review and approve.'
            },
            push: {
                title: 'Visitor Update Needs Approval',
                body: '{{visitorName}} has updated sensitive information ({{updatedFields}}) for student(s): {{studentNames}}. Please review and approve.'
            },
            email: {
                subject: 'Visitor Update Needs Approval',
                html: '<h1>Visitor Update Needs Approval</h1><p><strong>{{visitorName}}</strong> has updated sensitive information (<strong>{{updatedFields}}</strong>) for student(s): <strong>{{studentNames}}</strong>.</p><p>Please review this update in the portal.</p>'
            }
        }
    },

    VISITOR_UPDATED: {
        admin: {
            "in-app": {
                title: 'Visitor Updated',
                message: '{{visitorName}} information has been updated by the Parent.\nUpdated Fields: {{updatedFields}}'
            },
            push: {
                title: 'Visitor Updated',
                body: '{{visitorName}} information has been updated by the Parent.\nUpdated Fields: {{updatedFields}}'
            },
            email: {
                subject: 'Visitor Information Updated',
                html: '<h1>Visitor Updated</h1><p><strong>{{visitorName}}</strong> information has been updated by the Parent.</p><p><strong>Updated Fields:</strong> {{updatedFields}}</p>'
            }
        },
        warden: {
            "in-app": {
                title: 'Visitor Updated',
                message: '{{visitorName}} information has been updated by the Parent.\nUpdated Fields: {{updatedFields}}'
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
                title: '{{personType}} Checked In',
                message: '{{personName}} checked in to visit {{studentName}}.\nPurpose: {{purpose}}'
            },
            push: {
                title: '{{personType}} Checked In',
                body: '{{personName}} checked in to visit {{studentName}}.\nPurpose: {{purpose}}'
            },
            email: {
                subject: '{{personType}} Checked In',
                html: '<h1>{{personType}} Checked In</h1><p><strong>{{personName}}</strong> has checked into the hostel to visit <strong>{{studentName}}</strong>.</p><p><strong>Purpose:</strong> {{purpose}}</p><p><strong>Expected Exit:</strong> {{expectedExitTime}}</p>'
            }
        },
        student: {
            "in-app": {
                title: '{{personType}} Checked In',
                message: '{{personName}} checked in to visit you.\nPurpose: {{purpose}}'
            },
            push: {
                title: '{{personType}} Checked In',
                body: '{{personName}} checked in to visit you.\nPurpose: {{purpose}}'
            },
            email: {
                subject: '{{personType}} Checked In',
                html: '<h1>{{personType}} Checked In</h1><p><strong>{{personName}}</strong> has checked into the hostel to visit you.</p><p><strong>Purpose:</strong> {{purpose}}</p><p><strong>Expected Exit:</strong> {{expectedExitTime}}</p>'
            }
        }
    },

    VISIT_AUTO_CHECKED_OUT: {
        parent: {
            "in-app": {
                title: 'Visit Completed',
                message: 'The visit by {{personName}} to {{studentName}} for {{purpose}} has been automatically completed.'
            },
            push: {
                title: 'Visit Completed',
                body: 'The visit by {{personName}} to {{studentName}} for {{purpose}} has been automatically completed.'
            },
            email: {
                subject: 'Visit Automatically Completed',
                html: '<h1>Visit Completed</h1><p>The visit by <strong>{{personName}}</strong> to <strong>{{studentName}}</strong> has been automatically completed as the expected duration has passed.</p><p><strong>Purpose:</strong> {{purpose}}</p><p><strong>Check In:</strong> {{checkInTime}}</p><p><strong>Check Out:</strong> {{checkOutTime}}</p>'
            }
        },
        student: {
            "in-app": {
                title: 'Visit Completed',
                message: 'The visit by {{personName}} for {{purpose}} has been automatically completed.'
            },
            push: {
                title: 'Visit Completed',
                body: 'The visit by {{personName}} for {{purpose}} has been automatically completed.'
            },
            email: {
                subject: 'Visit Automatically Completed',
                html: '<h1>Visit Completed</h1><p>The visit by <strong>{{personName}}</strong> has been automatically completed as the expected duration has passed.</p><p><strong>Purpose:</strong> {{purpose}}</p><p><strong>Check In:</strong> {{checkInTime}}</p><p><strong>Check Out:</strong> {{checkOutTime}}</p>'
            }
        }
    }
};
