export default {
    events: {
        NEW_ANNOUNCEMENT: {
            channels: ['in-app', 'push', 'email']
        }
    },
    templates: {
        'in-app': {
            NEW_ANNOUNCEMENT: {
                STUDENT: (data) => ({
                    title: `New Announcement: ${data.title}`,
                    message: data.message,
                    type: 'info'
                }),
                PARENT: (data) => ({
                    title: `New Announcement: ${data.title}`,
                    message: data.message,
                    type: 'info'
                }),
                USER: (data) => ({
                    title: `New Announcement: ${data.title}`,
                    message: data.message,
                    type: 'info'
                })
            }
        },
        push: {
            NEW_ANNOUNCEMENT: {
                STUDENT: (data) => ({
                    title: `New Announcement: ${data.title}`,
                    body: data.message
                }),
                PARENT: (data) => ({
                    title: `New Announcement: ${data.title}`,
                    body: data.message
                }),
                USER: (data) => ({
                    title: `New Announcement: ${data.title}`,
                    body: data.message
                })
            }
        },
        email: {
            NEW_ANNOUNCEMENT: {
                STUDENT: (data) => ({
                    subject: `New Announcement: ${data.title}`,
                    html: `<p><strong>${data.title}</strong></p><p>${data.message}</p>`
                }),
                PARENT: (data) => ({
                    subject: `New Announcement: ${data.title}`,
                    html: `<p><strong>${data.title}</strong></p><p>${data.message}</p>`
                }),
                USER: (data) => ({
                    subject: `New Announcement: ${data.title}`,
                    html: `<p><strong>${data.title}</strong></p><p>${data.message}</p>`
                })
            }
        }
    }
};
