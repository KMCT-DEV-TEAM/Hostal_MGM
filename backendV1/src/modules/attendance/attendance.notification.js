export default {
    ATTENDANCE_OPENED: {
        student: {
            'in-app': {
                title: "Action Required: Mark Your Attendance",
                message: "The daily attendance window is now open. Please ensure you mark your attendance promptly to avoid being marked as absent.",
                type: "warning"
            },
            'push': {
                title: "Daily Attendance Open ",
                body: "Don't forget! The attendance window is now open. Please mark yourself present."
            }
        },
        warden: {
            'in-app': {
                title: "Attendance Window Created",
                message: "You have successfully opened the daily attendance window for your hostel.",
                type: "success"
            }
        },
        admin: {
            'in-app': {
                title: "Attendance Window Created",
                message: "An attendance window was successfully opened for a hostel.",
                type: "info"
            }
        }
    },
    ATTENDANCE_CLOSED: {
        student: {
            'in-app': {
                title: "Attendance Window Closed",
                message: "The daily attendance window has been closed. If you failed to mark your attendance, you have been recorded as absent. Please contact your warden if this is a mistake.",
                type: "info"
            }
        },
        warden: {
            'in-app': {
                title: "Attendance Window Completed",
                message: "The attendance window has been finalized and closed. All unmarked students have been recorded as absent.",
                type: "success"
            }
        },
        admin: {
            'in-app': {
                title: "Attendance Window Closed",
                message: "An attendance window was finalized and closed.",
                type: "info"
            }
        }
    }
};
