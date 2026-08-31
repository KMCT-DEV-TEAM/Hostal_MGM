export default {
    MENTOR_ASSIGNED: {
        mentor: {
            "in-app": {
                title: "New Batch Assigned",
                message: "You have been assigned as the mentor for batch: {{batchName}}.",
                type: "success"
            },
            push: {
                title: "New Batch Assigned",
                body: "You have been assigned as the mentor for batch: {{batchName}}."
            }
        }
    },
    MENTOR_TRANSFERRED: {
        mentor: {
            "in-app": {
                title: "Batch Mentorship Transferred",
                message: "Your mentorship assignment for batch {{batchName}} has been transferred.",
                type: "info"
            },
            push: {
                title: "Batch Mentorship Transferred",
                body: "Your mentorship assignment for batch {{batchName}} has been transferred."
            }
        }
    },
    MENTOR_COMPLETED: {
        mentor: {
            "in-app": {
                title: "Batch Mentorship Completed",
                message: "Your mentorship assignment for batch {{batchName}} has been completed.",
                type: "success"
            },
            push: {
                title: "Batch Mentorship Completed",
                body: "Your mentorship assignment for batch {{batchName}} has been completed."
            }
        }
    },
    MENTOR_RELEASED: {
        mentor: {
            "in-app": {
                title: "Released from Batch",
                message: "You have been released from batch {{batchName}}. Reason: {{reason}}",
                type: "info"
            },
            push: {
                title: "Released from Batch",
                body: "You have been released from batch {{batchName}}. Reason: {{reason}}"
            }
        },
        student: {
            "in-app": {
                title: "Mentor Unassigned",
                message: "{{message}}",
                type: "info"
            },
            push: {
                title: "Mentor Unassigned",
                body: "{{message}}"
            }
        },
        parent: {
            "in-app": {
                title: "Mentor Unassigned",
                message: "{{message}}",
                type: "info"
            },
            push: {
                title: "Mentor Unassigned",
                body: "{{message}}"
            }
        }
    }
};
