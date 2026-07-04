import { userResolver, studentResolver, parentResolver } from './resolvers.js';

/**
 * Recipient Service
 * 
 * Orchestrates recipient resolution by parsing the targeting payload 
 * and delegating to specialized database resolvers.
 * Never directly queries the database or handles Mongoose documents.
 */
class RecipientService {
    constructor() {}

    /**
     * Resolves target queries into a MongoDB Cursor yielding standard DTOs.
     * @param {Object} target - e.g. { type: 'STUDENT', filter: { courseId: '123' } }
     * @returns {AsyncIterable} A MongoDB Cursor yielding Recipient DTOs
     */
    async getRecipients(target) {
        if (!target || !target.type) {
            throw new Error('Target must be an object with a valid "type" property.');
        }

        const filter = target.filter || {};

        switch (target.type.toUpperCase()) {
            case 'USER':
                return await userResolver.resolve(filter);
            case 'STUDENT':
                return await studentResolver.resolve(filter);
            case 'PARENT':
                return await parentResolver.resolve(filter);
            
            // Abstract target mappings
            case 'HOSTEL':
            case 'ROOM':
            case 'COURSE':
            case 'DEPARTMENT':
            case 'BATCH':
            case 'ORGANIZATION':
                // Targeting these entities implies targeting the Students associated with them
                return await studentResolver.resolve(filter);
            case 'ROLE':
                // Targeting a Role implies targeting Users
                return await userResolver.resolve(filter);
            default:
                throw new Error(`Unsupported recipient type: ${target.type}`);
        }
    }
}

export const recipientService = new RecipientService();
