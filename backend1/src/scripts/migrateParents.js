import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Parent from '../modules/parents/parent.model.js';
import StudentParent from '../modules/parents/studentParent.model.js';
import connectDB from '../config/db.js';

// Setup env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });



const runMigration = async () => {
    console.log("Starting Parent M:N Data Migration...");

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        // 1. We must use the raw collection to read legacy fields that were removed from the schema
        const parentsCollection = mongoose.connection.db.collection('parents');
        const legacyParents = await parentsCollection.find({}).toArray();

        console.log(`Found ${legacyParents.length} total parent records.`);

        // 2. Group by phone
        const groupedParents = {};
        for (const p of legacyParents) {
            const phone = p.phone ? String(p.phone).trim() : "UNKNOWN";
            if (!groupedParents[phone]) {
                groupedParents[phone] = [];
            }
            groupedParents[phone].push(p);
        }

        console.log(`Grouped into ${Object.keys(groupedParents).length} unique phone numbers.`);

        let newLinksCreated = 0;
        let parentsDeactivated = 0;
        let masterRecordsKept = 0;

        // 3. Process each group
        for (const phone in groupedParents) {
            const group = groupedParents[phone];

            // Elect Master Record (prefer verified, or most recently updated)
            group.sort((a, b) => {
                if (a.isVerified && !b.isVerified) return -1;
                if (!a.isVerified && b.isVerified) return 1;
                return new Date(b.updatedAt) - new Date(a.updatedAt);
            });

            const master = group[0];
            masterRecordsKept++;

            // 4. Create StudentParent Links for ALL students in this group
            for (const member of group) {
                if (member.studentId) {
                    // Check if link already exists (rerunnability)
                    const existingLink = await StudentParent.findOne({
                        parentId: master._id,
                        studentId: member.studentId
                    }).session(session);

                    if (!existingLink) {
                        await StudentParent.create([{
                            parentId: master._id,
                            studentId: member.studentId,
                            relationship: member.relationship || 'guardian',
                            defaultGuardian: member.defaultGuardian || false,
                            status: member.isActive === false ? 'inactive' : 'active'
                        }], { session });
                        newLinksCreated++;
                    }
                }
            }

            // 5. Cleanup duplicates (Soft delete)
            if (group.length > 1) {
                for (let i = 1; i < group.length; i++) {
                    const duplicate = group[i];
                    // Append deleted marker to unique fields to resolve index constraints
                    const deletedMarker = `_DELETED_${duplicate._id.toString()}`;
                    await parentsCollection.updateOne(
                        { _id: duplicate._id },
                        {
                            $set: {
                                isActive: false,
                                phone: duplicate.phone ? `${duplicate.phone}${deletedMarker}` : deletedMarker,
                                email: duplicate.email ? `${duplicate.email}${deletedMarker}` : undefined
                            }
                        },
                        { session }
                    );
                    parentsDeactivated++;
                }
            }
        }

        await session.commitTransaction();
        console.log('--- Migration Completed Successfully ---');
        console.log(`Master Records Maintained: ${masterRecordsKept}`);
        console.log(`New StudentParent Links: ${newLinksCreated}`);
        console.log(`Duplicate Parents Deactivated/Archived: ${parentsDeactivated}`);

    } catch (error) {
        await session.abortTransaction();
        console.error("Migration failed, transaction aborted.", error);
    } finally {
        session.endSession();
        process.exit(0);
    }
};

const execute = async () => {
    await connectDB();
    await runMigration();
};

execute();
