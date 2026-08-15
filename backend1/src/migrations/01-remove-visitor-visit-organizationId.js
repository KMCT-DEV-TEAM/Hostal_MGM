import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const removeVisitorVisitOrganizationId = async () => {
    try {
        console.log('Connecting to MongoDB...');
        // Assume default DB connection string if not in env for some reason
        const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hostel_mgm';
        await mongoose.connect(dbUri);
        console.log('Connected successfully.');

        console.log('Starting migration to remove organizationId from VisitorVisit collection...');

        // Update many documents by unsetting the organizationId field
        const result = await mongoose.connection.collection('visitorvisits').updateMany(
            { organizationId: { $exists: true } },
            { $unset: { organizationId: "" } }
        );

        console.log('Migration completed successfully.');
        console.log(`Matched documents: ${result.matchedCount}`);
        console.log(`Modified documents (organizationId removed): ${result.modifiedCount}`);

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        console.log('Closing MongoDB connection...');
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
};

removeVisitorVisitOrganizationId();
