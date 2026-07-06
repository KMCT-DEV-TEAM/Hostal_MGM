/**
 * Builds the sender object required by the notification orchestrator.
 * 
 * @param {Object} user - The authenticated user object (e.g., req.user)
 * @returns {Object|null} sender - The formatted sender object
 */
export const buildSender = (user) => {
    if (!user) return null;

    let model = 'User';
    const normalizedRole = (user.role || '').toLowerCase();

    if (normalizedRole === 'student') {
        model = 'Student';
    } else if (normalizedRole === 'parent') {
        model = 'Parent';
    }
    console.log(user, "user")

    return {
        id: user.id || user._id,
        model: model,
        snapshot: {
            name: user.name || user.parentName || user.firstName || 'Unknown User',
            role: user.role || 'system'
        }
    };
};
