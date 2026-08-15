/**
 * Audience Resolver
 * 
 * Responsible for determining the abstract "audience" category 
 * (e.g., 'student', 'parent', 'admin', 'warden') from a given recipient document/object.
 */
class AudienceResolver {
    /**
     * Resolves the audience string for a recipient.
     * @param {Object} recipient - The recipient object (e.g. from recipientCursor)
     * @returns {String} audience - e.g., 'student', 'parent', 'admin', 'warden'
     */
    resolve(recipient) {
        // Fallbacks for checking model or recipientType properties
        const model = recipient.recipientType || recipient.model || '';

        const normalizedModel = model.toString().toUpperCase();

        if (normalizedModel === 'STUDENT') {
            return 'student';
        }

        if (normalizedModel === 'PARENT') {
            return 'parent';
        }

        if (normalizedModel === 'USER') {
            const role = recipient.metadata?.role || recipient.role || '';
            const normalizedRole = role.toString().toLowerCase();
            return normalizedRole || 'admin';
        }

        // Default fallback if unknown
        return 'admin';
    }
}

export const audienceResolver = new AudienceResolver();
