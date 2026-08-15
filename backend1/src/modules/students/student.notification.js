export default {
    STUDENT_CREATED: {
        student: {
            "in-app": {
                title: "Welcome to the Application",
                message: "Your account has been successfully created. Welcome aboard!",
                type: "success"
            },
            push: {
                title: "Account Created",
                body: "Your student account has been successfully created."
            },
            email: {
                subject: "Welcome to the Application",
                html: "<p>Hello <strong>{{studentName}}</strong>,</p><p>Your student account has been successfully created.</p><p>Welcome to the platform!</p>"
            }
        },
        parent: {
            "in-app": {
                title: "Student Account Linked",
                message: "Your account has been successfully created and linked to your ward, {{studentName}}.",
                type: "success"
            },
            push: {
                title: "Account Created",
                body: "Your account has been created and linked to {{studentName}}."
            },
            email: {
                subject: "Welcome: Account Created",
                html: "<p>Hello,</p><p>Your parent account has been successfully created and linked to your ward, <strong>{{studentName}}</strong>.</p>"
            }
        }
    },
    
    STUDENT_BATCH_CHANGED: {
        student: {
            "in-app": {
                title: "Batch Updated",
                message: "Your batch has been updated to {{newBatchName}}.",
                type: "info"
            },
            push: {
                title: "Batch Updated",
                body: "Your assigned batch has been changed."
            }
        },
        mentor: {
            "in-app": {
                title: "Student Assigned",
                message: "{{studentName}} has been assigned to your batch.",
                type: "info",
                link: "/dashboard/students/{{studentId}}"
            },
            push: {
                title: "Student Batch Update",
                body: "{{studentName}}'s batch assignment has been updated."
            }
        }
    },

    STUDENT_HOSTEL_CHANGED: {
        student: {
            "in-app": {
                title: "Hostel Allocation Updated",
                message: "Your hostel allocation has been updated.",
                type: "info"
            },
            push: {
                title: "Hostel Allocation Updated",
                body: "Your hostel allocation has been updated."
            }
        },
        warden: {
            "in-app": {
                title: "Hostel Allocation Update",
                message: "{{studentName}}'s hostel allocation has changed.",
                type: "info",
                link: "/dashboard/students/{{studentId}}"
            }
        }
    },

    EMAIL_CHANGED_CONFIRMATION: {
        student: {
            "in-app": {
                title: "Email Address Updated",
                message: "Your email address has been successfully updated.",
                type: "success"
            },
            push: {
                title: "Email Address Updated",
                body: "Your email address has been successfully updated."
            },
            email: {
                subject: "Email Address Successfully Updated",
                html: "<p>Hello <strong>{{studentName}}</strong>,</p><p>This email address has been successfully set as your new contact email.</p>"
            }
        }
    },

    STUDENT_ACTIVATED: {
        student: {
            "in-app": {
                title: "Account Activated",
                message: "Your account has been activated by the administration.",
                type: "success"
            },
            push: {
                title: "Account Activated",
                body: "Your account has been activated."
            },
            email: {
                subject: "Account Activated",
                html: "<p>Hello <strong>{{studentName}}</strong>,</p><p>Your student account has been activated.</p>"
            }
        },
        parent: {
            "in-app": {
                title: "Ward's Account Activated",
                message: "The account for your ward, {{studentName}}, has been activated.",
                type: "success"
            },
            push: {
                title: "Account Activated",
                body: "The account for {{studentName}} has been activated."
            }
        }
    },

    STUDENT_DEACTIVATED: {
        student: {
            "in-app": {
                title: "Account Deactivated",
                message: "Your account has been deactivated by the administration.",
                type: "warning"
            },
            push: {
                title: "Account Deactivated",
                body: "Your account has been deactivated by the administration."
            },
            email: {
                subject: "Account Deactivated",
                html: "<p>Hello <strong>{{studentName}}</strong>,</p><p>We are writing to inform you that your student account has been deactivated by the administration.</p>"
            }
        },
        parent: {
            "in-app": {
                title: "Ward's Account Deactivated",
                message: "The account for your ward, {{studentName}}, has been deactivated.",
                type: "warning"
            },
            push: {
                title: "Ward's Account Deactivated",
                body: "The account for your ward, {{studentName}}, has been deactivated."
            },
            email: {
                subject: "Account Deactivated",
                html: "<p>Hello,</p><p>The account for your ward, <strong>{{studentName}}</strong>, has been deactivated by the administration.</p>"
            }
        },
        warden: {
            "in-app": {
                title: "Student Deactivated",
                message: "{{studentName}} has been deactivated.",
                type: "warning",
                link: "/dashboard/students/{{studentId}}"
            },
            push: {
                title: "Student Deactivated",
                body: "{{studentName}} has been deactivated."
            }
        },
        mentor: {
            "in-app": {
                title: "Student Deactivated",
                message: "{{studentName}} has been deactivated.",
                type: "warning",
                link: "/dashboard/students/{{studentId}}"
            },
            push: {
                title: "Student Deactivated",
                body: "{{studentName}} has been deactivated."
            }
        }
    },

    STUDENT_ORGANIZATION_CHANGED: {
        student: {
            "in-app": {
                title: "Organization Updated",
                message: "Your organization assignment has been updated.",
                type: "info"
            },
            push: {
                title: "Organization Updated",
                body: "Your organization assignment has been updated."
            }
        },
        parent: {
            "in-app": {
                title: "Organization Updated",
                message: "The organization assignment for {{studentName}} has been updated.",
                type: "info"
            },
            push: {
                title: "Organization Updated",
                body: "The organization assignment for {{studentName}} has been updated."
            }
        },
        admin: {
            "in-app": {
                title: "Student Transferred",
                message: "{{studentName}} has been transferred in or out of your organization.",
                type: "info",
                link: "/dashboard/students/{{studentId}}"
            }
        }
    }
};
