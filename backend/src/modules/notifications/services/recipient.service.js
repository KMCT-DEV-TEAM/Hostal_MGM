import User from '../../users/user.model.js';
import mongoose from 'mongoose';

/**
 * Recipient Service
 * 
 * Handles fetching user data, contact information, and resolving
 * abstract recipient targets (e.g., 'all-wardens', 'parents-of-batch')
 * into lightweight Data Transfer Objects (DTOs).
 */
class RecipientService {
    constructor() { }

    /**
     * Resolves an abstract recipient identifier into concrete user DTOs.
     * @param {Array|String} target - User ID, array of IDs, or target group alias
     * @returns {Array} List of lightweight recipient DTOs
     */
    async getRecipients(target) {
        if (!target) return [];

        let matchQuery = {};

        if (Array.isArray(target)) {
            // Cast to ObjectId if they are strings
            const objectIds = target.map(id => new mongoose.Types.ObjectId(id));
            matchQuery = { _id: { $in: objectIds } };
        } else if (typeof target === 'string') {
            switch (target.toLowerCase()) {
                case 'all-wardens':
                    matchQuery = { role: 'warden' };
                    break;
                case 'all-students':
                    matchQuery = { role: 'student' };
                    break;
                case 'all-parents':
                    matchQuery = { role: 'parent' };
                    break;
                case 'all-admins':
                    matchQuery = { role: 'admin' };
                    break;
                default:
                    // Treat as a single User ID
                    matchQuery = { _id: new mongoose.Types.ObjectId(target) };
            }
        } else {
            throw new Error(`Invalid recipient target format: ${typeof target}`);
        }

        // Use aggregation pipeline to strictly return a lightweight DTO
        // Never pass raw Mongoose documents between services.
        const pipeline = [
            { $match: matchQuery },
            {
                $project: {
                    _id: 0,
                    id: '$_id',
                    type: '$role',
                    name: '$name',
                    email: '$email',
                    pushToken: '$pushToken',
                    //     language: '$language',
                    //     preferences: '$preferences'
                }
            }
        ];

        return await User.aggregate(pipeline);
    }
}

export const recipientService = new RecipientService();
