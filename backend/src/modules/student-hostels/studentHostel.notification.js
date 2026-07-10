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
        }
    }
};
