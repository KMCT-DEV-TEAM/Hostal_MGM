export default {
    HOSTEL_ALLOCATED: {
        student: {
            "in-app": {
                title: "Hostel Allocated",
                message: "You have been allocated to a hostel room: {{roomNumber}}.",
                type: "success"
            },
            push: {
                title: "Hostel Allocated",
                body: "You have been allocated to a hostel room: {{roomNumber}}."
            }
        },
        parent: {
            "in-app": {
                title: "Ward's Hostel Allocated",
                message: "Your ward {{studentName}} has been allocated to a hostel room: {{roomNumber}}.",
                type: "info"
            },
            push: {
                title: "Ward's Hostel Allocated",
                body: "Your ward {{studentName}} has been allocated to a hostel room: {{roomNumber}}."
            }
        },
        user: {
            "in-app": {
                title: "Warden – Hostel Allocated",
                message: "A new student has been allocated to your hostel.",
                type: "info"
            },
            push: {
                title: "Warden – Hostel Allocated",
                body: "A new student has been allocated to your hostel."
            }
        }
    },
    HOSTEL_CHANGED: {
        student: {
            "in-app": {
                title: "Hostel Changed",
                message: "Your hostel allocation has been changed. New room: {{roomNumber}}.",
                type: "info"
            },
            push: {
                title: "Hostel Changed",
                body: "Your hostel allocation has been changed. New room: {{roomNumber}}."
            }
        },
        parent: {
            "in-app": {
                title: "Ward's Hostel Changed",
                message: "Your ward {{studentName}}'s hostel allocation has been changed. New room: {{roomNumber}}.",
                type: "info"
            },
            push: {
                title: "Ward's Hostel Changed",
                body: "Your ward {{studentName}}'s hostel allocation has been changed. New room: {{roomNumber}}."
            }
        },
        user: {
            "in-app": {
                title: "Warden – Hostel Changed",
                message: "{{wardenMessage}}",
                type: "info"
            },
            push: {
                title: "Warden – Hostel Changed",
                body: "{{wardenMessage}}"
            }
        }
    },
    HOSTEL_TRANSFERRED: {
        student: {
            "in-app": {
                title: "Hostel Transferred",
                message: "Your hostel accommodation has been changed.",
                type: "info"
            },
            push: {
                title: "Hostel Transferred",
                body: "Your hostel accommodation has been changed."
            }
        },
        parent: {
            "in-app": {
                title: "Ward's Hostel Transferred",
                message: "Your ward's hostel accommodation has been changed.",
                type: "info"
            },
            push: {
                title: "Ward's Hostel Transferred",
                body: "Your ward's hostel accommodation has been changed."
            }
        },
        user: {
            "in-app": {
                title: "Warden – Hostel Transferred",
                message: "{{message}}",
                type: "info"
            },
            push: {
                title: "Warden – Hostel Transferred",
                body: "{{message}}"
            }
        }
    },
    PASS_HOSTEL_TRANSFERRED: {
        student: {
            "in-app": {
                title: "Pass Hostel Transferred",
                message: "{{studentMessage}}",
                type: "info"
            },
            push: {
                title: "Pass Hostel Transferred",
                body: "{{studentMessage}}"
            }
        },
        parent: {
            "in-app": {
                title: "Pass Hostel Transferred",
                message: "{{parentMessage}}",
                type: "info"
            },
            push: {
                title: "Pass Hostel Transferred",
                body: "{{parentMessage}}"
            }
        },
        user: {
            "in-app": {
                title: "Warden – Pass Hostel Transferred",
                message: "{{wardenMessage}}",
                type: "info"
            },
            push: {
                title: "Warden – Pass Hostel Transferred",
                body: "{{wardenMessage}}"
            }
        }
    },
    HOSTEL_VACATED: {
        student: {
            "in-app": {
                title: "Hostel Vacated",
                message: "You have been vacated from your hostel.",
                type: "warning"
            },
            push: {
                title: "Hostel Vacated",
                body: "You have been vacated from your hostel."
            }
        },
        parent: {
            "in-app": {
                title: "Ward's Hostel Vacated",
                message: "Your ward {{studentName}} has been vacated from their hostel.",
                type: "warning"
            },
            push: {
                title: "Ward's Hostel Vacated",
                body: "Your ward {{studentName}} has been vacated from their hostel."
            }
        },
        user: {
            "in-app": {
                title: "Warden – Hostel Vacated",
                message: "{{message}}",
                type: "info"
            },
            push: {
                title: "Warden – Hostel Vacated",
                body: "{{message}}"
            }
        }
    }
};
