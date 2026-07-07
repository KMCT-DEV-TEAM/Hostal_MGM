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
            }
        },
        admin: {
            'in-app': {
                title: "New Complaint",
                message: "A new complaint '{{title}}' has been logged."
            }
        },
        warden: {
            'in-app': {
                title: "New Complaint",
                message: "A new complaint '{{title}}' has been logged in your hostel."
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
                message: "You marked the complaint '{{title}}' as resolved."
            }
        },
        warden: {
            'in-app': {
                title: "Complaint Resolved",
                message: "The complaint '{{title}}' has been resolved."
            }
        }
    }
};
