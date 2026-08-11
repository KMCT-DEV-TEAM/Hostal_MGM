export default {
    FURNITURE_ALLOCATED: {
        student: {
            "in-app": {
                title: "Furniture Allocated",
                message: "You have been allocated {{count}} furniture item(s).",
                type: "info"
            },
            push: {
                title: "Furniture Allocated",
                body: "You have been allocated {{count}} furniture item(s)."
            }
        },
        parent: {
            "in-app": {
                title: "Ward's Furniture Allocated",
                message: "Your ward {{studentName}} has been allocated {{count}} furniture item(s).",
                type: "info"
            },
            push: {
                title: "Ward's Furniture Allocated",
                body: "Your ward {{studentName}} has been allocated {{count}} furniture item(s)."
            }
        },
        user: {
            "in-app": {
                title: "Warden – Furniture Allocated",
                message: "A student in your hostel ({{studentName}}) has been allocated {{count}} furniture item(s).",
                type: "info"
            },
            push: {
                title: "Warden – Furniture Allocated",
                body: "A student in your hostel ({{studentName}}) has been allocated {{count}} furniture item(s)."
            }
        }
    },
    FURNITURE_RETURNED: {
        student: {
            "in-app": {
                title: "Furniture Returned",
                message: "You have successfully returned a furniture item ({{assetId}}).",
                type: "success"
            },
            push: {
                title: "Furniture Returned",
                body: "You have successfully returned a furniture item ({{assetId}})."
            }
        },
        parent: {
            "in-app": {
                title: "Ward's Furniture Returned",
                message: "Your ward {{studentName}} has returned a furniture item ({{assetId}}).",
                type: "info"
            },
            push: {
                title: "Ward's Furniture Returned",
                body: "Your ward {{studentName}} has returned a furniture item ({{assetId}})."
            }
        },
        user: {
            "in-app": {
                title: "Warden – Furniture Returned",
                message: "A student in your hostel ({{studentName}}) has returned a furniture item ({{assetId}}).",
                type: "info"
            },
            push: {
                title: "Warden – Furniture Returned",
                body: "A student in your hostel ({{studentName}}) has returned a furniture item ({{assetId}})."
            }
        }
    },
    FURNITURE_STATUS_CHANGED: {
        student: {
            "in-app": {
                title: "Furniture Status Changed",
                message: "Your furniture item ({{assetId}}) has been marked as {{newStatus}}.",
                type: "warning"
            },
            push: {
                title: "Furniture Status Changed",
                body: "Your furniture item ({{assetId}}) has been marked as {{newStatus}}."
            }
        },
        user: {
            "in-app": {
                title: "Warden – Furniture Status Changed",
                message: "Furniture item ({{assetId}}) in your hostel has been marked as {{newStatus}}.",
                type: "warning"
            },
            push: {
                title: "Warden – Furniture Status Changed",
                body: "Furniture item ({{assetId}}) in your hostel has been marked as {{newStatus}}."
            }
        }
    }
};
