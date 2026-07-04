export default {
    COMPLAINT_CREATED: {
        'in-app': {
            title: "Complaint Logged",
            message: "Your complaint '{{title}}' has been logged successfully."
        },
        'email': {
            subject: "Complaint Received",
            html: "<p>We have received your complaint regarding '{{title}}'. Our team will look into it shortly.</p>"
        }
    },
    COMPLAINT_RESOLVED: {
        'in-app': {
            title: "Complaint Resolved",
            message: "Your complaint '{{title}}' has been marked as resolved."
        },
        'push': {
            title: "Complaint Resolved",
            body: "Your complaint '{{title}}' was resolved."
        }
    }
};
