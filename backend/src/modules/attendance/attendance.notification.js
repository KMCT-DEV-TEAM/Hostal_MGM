export default {
    ATTENDANCE_OPENED: {
        student: {
            'in-app': {
                title: "Attendance Opened",
                message: "Attendance for today is now open. Please mark your attendance."
            },
            'push': {
                title: "Attendance Open",
                body: "Please mark your attendance for today."
            }
        },
        warden: {
            'in-app': {
                title: "Attendance Window Created",
                message: "You have opened the attendance window for your hostel."
            }
        },
        admin: {
            'in-app': {
                title: "Attendance Window Created",
                message: "An attendance window was opened for a hostel."
            }
        }
    },
    ATTENDANCE_CLOSED: {
        student: {
            'in-app': {
                title: "Attendance Closed",
                message: "Attendance for today is now closed."
            }
        },
        warden: {
            'in-app': {
                title: "Attendance Closed",
                message: "The attendance window for your hostel has been closed."
            }
        },
        admin: {
            'in-app': {
                title: "Attendance Closed",
                message: "An attendance window was closed."
            }
        }
    }
};
