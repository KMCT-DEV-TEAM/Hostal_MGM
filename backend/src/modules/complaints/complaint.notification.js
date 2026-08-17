export default {
    COMPLAINT_CREATED: {
        student: {
            'in-app': {
                title: "Complaint Logged",
                message: "Your complaint '{{title}}' has been logged successfully."
            },
            'email': {
                subject: "Complaint Received",
                html: "<p>We have received your complaint regarding '{{title}}'. Our team will look into it shortly.</p>"
            },
            'push': {
                title: "Complaint Logged",
                body: "Your complaint '{{title}}' has been logged successfully."
            }
        },
        admin: {
            'in-app': {
                title: "New Complaint",
                message: "{{studentName}} has logged a new complaint: '{{title}}'."
            },
            'push': {
                title: "New Complaint",
                body: "{{studentName}} has logged a new complaint."
            }
        },
        super_admin: {
            'in-app': {
                title: "New Complaint",
                message: "{{studentName}} has logged a new complaint: '{{title}}'."
            },
            'push': {
                title: "New Complaint",
                body: "{{studentName}} has logged a new complaint."
            }
        },
        warden: {
            'in-app': {
                title: "New Complaint",
                message: "{{studentName}} has logged a new complaint: '{{title}}' in your hostel."
            },
            'push': {
                title: "New Complaint",
                body: "{{studentName}} has logged a new complaint."
            }
        }
    },
    COMPLAINT_RESOLVED: {
        student: {
            'in-app': {
                title: "Complaint Resolved",
                message: "Your complaint '{{title}}' has been marked as resolved."
            },
            'push': {
                title: "Complaint Resolved",
                body: "Your complaint '{{title}}' was resolved."
            }
        },
        admin: {
            'in-app': {
                title: "Complaint Resolved",
                message: "The complaint '{{title}}' has been resolved."
            },
            'push': {
                title: "Complaint Resolved",
                body: "The complaint '{{title}}' has been resolved."
            }
        },
        super_admin: {
            'in-app': {
                title: "Complaint Resolved",
                message: "The complaint '{{title}}' has been resolved."
            },
            'push': {
                title: "Complaint Resolved",
                body: "The complaint '{{title}}' has been resolved."
            }
        },
        warden: {
            'in-app': {
                title: "Complaint Resolved",
                message: "The complaint '{{title}}' has been resolved."
            },
            'push': {
                title: "Complaint Resolved",
                body: "The complaint '{{title}}' has been resolved."
            }
        }
    },
    COMPLAINT_STATUS_UPDATED: {
        student: {
            'in-app': {
                title: "Complaint Status Updated",
                message: "The status of your complaint '{{title}}' has been updated to {{status}}."
            },
            'push': {
                title: "Complaint Status Updated",
                body: "Your complaint '{{title}}' is now {{status}}."
            }
        }
    },
    COMPLAINT_ASSIGNED: {
        student: {
            'in-app': {
                title: "Complaint Assigned",
                message: "Maintenance staff has been assigned to your complaint '{{title}}'."
            },
            'push': {
                title: "Complaint Assigned",
                body: "Maintenance staff has been assigned to your complaint."
            }
        },
        user: {
            'in-app': {
                title: "New Task Assigned",
                message: "You have been assigned to a new complaint: '{{title}}'."
            },
            'push': {
                title: "New Task Assigned",
                body: "You have been assigned to a new complaint: '{{title}}'."
            }
        }
    },
    COMPLAINT_RESOLUTION_SUBMITTED: {
        warden: {
            'in-app': {
                title: "Resolution Submitted",
                message: "Maintenance staff has submitted a resolution for complaint '{{title}}'. Awaiting your approval."
            },
            'push': {
                title: "Resolution Submitted",
                body: "Maintenance staff has submitted a resolution for a complaint."
            }
        },
        admin: {
            'in-app': {
                title: "Resolution Submitted",
                message: "Maintenance staff has submitted a resolution for complaint '{{title}}'."
            },
            'push': {
                title: "Resolution Submitted",
                body: "Maintenance staff has submitted a resolution for a complaint."
            }
        },
        super_admin: {
            'in-app': {
                title: "Resolution Submitted",
                message: "Maintenance staff has submitted a resolution for complaint '{{title}}'."
            },
            'push': {
                title: "Resolution Submitted",
                body: "Maintenance staff has submitted a resolution for a complaint."
            }
        }
    },
    COMPLAINT_RESOLUTION_REJECTED: {
        user: {
            'in-app': {
                title: "Resolution Rejected",
                message: "Your resolution for complaint '{{title}}' was rejected. Remarks: {{remarks}}"
            },
            'push': {
                title: "Resolution Rejected",
                body: "Your resolution for complaint '{{title}}' was rejected."
            }
        }
    },
    COMPLAINT_TASK_REJECTED: {
        warden: {
            'in-app': {
                title: "Assigned Task Rejected",
                message: "Maintenance staff rejected the task for complaint '{{title}}'. Remarks: {{remarks}}"
            },
            'push': {
                title: "Assigned Task Rejected",
                body: "Maintenance staff rejected the task for a complaint."
            }
        },
        admin: {
            'in-app': {
                title: "Assigned Task Rejected",
                message: "Maintenance staff rejected the task for complaint '{{title}}'. Remarks: {{remarks}}"
            },
            'push': {
                title: "Assigned Task Rejected",
                body: "Maintenance staff rejected the task for a complaint."
            }
        },
        super_admin: {
            'in-app': {
                title: "Assigned Task Rejected",
                message: "Maintenance staff rejected the task for complaint '{{title}}'. Remarks: {{remarks}}"
            },
            'push': {
                title: "Assigned Task Rejected",
                body: "Maintenance staff rejected the task for a complaint."
            }
        }
    },
    COMPLAINT_DELETED: {
        admin: {
            'in-app': {
                title: "Complaint Withdrawn",
                message: "{{studentName}} has withdrawn their complaint '{{title}}'."
            },
            'push': {
                title: "Complaint Withdrawn",
                body: "{{studentName}} has withdrawn their complaint."
            }
        },
        super_admin: {
            'in-app': {
                title: "Complaint Withdrawn",
                message: "{{studentName}} has withdrawn their complaint '{{title}}'."
            },
            'push': {
                title: "Complaint Withdrawn",
                body: "{{studentName}} has withdrawn their complaint."
            }
        },
        warden: {
            'in-app': {
                title: "Complaint Withdrawn",
                message: "{{studentName}} has withdrawn their complaint '{{title}}'."
            },
            'push': {
                title: "Complaint Withdrawn",
                body: "{{studentName}} has withdrawn their complaint."
            }
        }
    }
};
