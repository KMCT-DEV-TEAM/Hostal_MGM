import User from '../../users/user.model.js';
import Student from '../../students/student.model.js';
import Parent from '../../parents/parent.model.js';
import mongoose from 'mongoose';

export class UserResolver {
    /**
     * Resolves User identity documents using MongoDB Aggregation and Cursors.
     */
    async resolve(filter = {}) {
        let matchQuery = {};

        if (filter.role) matchQuery.role = filter.role;
        if (filter.organizationId) matchQuery.organization = new mongoose.Types.ObjectId(filter.organizationId);
        if (filter.isActive !== undefined) matchQuery.isActive = filter.isActive;
        if (filter.specialization) matchQuery.specialization = filter.specialization;
        if (filter.userId) matchQuery._id = new mongoose.Types.ObjectId(filter.userId);
        if (filter.userIds && Array.isArray(filter.userIds)) {
            matchQuery._id = { $in: filter.userIds.map(id => new mongoose.Types.ObjectId(id)) };
        }

        const pipeline = [
            { $match: matchQuery },
            {
                $project: {
                    _id: 0,
                    id: '$_id',
                    recipientType: { $literal: 'USER' },
                    name: '$name',
                    email: '$email',
                    phone: '$phone',
                    pushToken: '$pushToken',
                    metadata: {
                        role: '$role',
                        organization: '$organization'
                    }
                }
            }
        ];

        return User.aggregate(pipeline).cursor({ batchSize: 500 });
    }
}

export class StudentResolver {
    /**
     * Resolves Student identity documents using MongoDB Aggregation and Cursors.
     */
    async resolve(filter = {}) {
        let matchQuery = {};

        if (filter.hostelId) matchQuery.hostelId = new mongoose.Types.ObjectId(filter.hostelId);
        if (filter.courseId) matchQuery.courseId = new mongoose.Types.ObjectId(filter.courseId);
        if (filter.departmentId) matchQuery.departmentId = new mongoose.Types.ObjectId(filter.departmentId);
        if (filter.batchId) matchQuery.batchId = new mongoose.Types.ObjectId(filter.batchId);
        if (filter.organizationId) matchQuery.organizationId = new mongoose.Types.ObjectId(filter.organizationId);
        if (filter.hostelStatus) matchQuery.hostelStatus = filter.hostelStatus;
        if (filter.isActive !== undefined) matchQuery.isActive = filter.isActive;
        if (filter.studentId) matchQuery._id = new mongoose.Types.ObjectId(filter.studentId);
        if (filter.studentIds && Array.isArray(filter.studentIds)) {
            matchQuery._id = { $in: filter.studentIds.map(id => new mongoose.Types.ObjectId(id)) };
        }

        const pipeline = [
            { $match: matchQuery },
            {
                $project: {
                    _id: 0,
                    id: '$_id',
                    recipientType: { $literal: 'STUDENT' },
                    name: { $ifNull: ['$name', { $concat: ['$firstName', ' ', '$lastName'] }] },
                    email: '$email',
                    phone: '$phone',
                    pushToken: '$pushToken',
                    metadata: {
                        hostel: '$hostelId',
                        course: '$courseId',
                        batch: '$batchId'
                    }
                }
            }
        ];

        return Student.aggregate(pipeline).cursor({ batchSize: 500 });
    }
}

export class ParentResolver {
    /**
     * Resolves Parent identity documents using MongoDB Aggregation and Cursors.
     */
    async resolve(filter = {}) {
        let matchQuery = {};

        if (filter.studentId) matchQuery.studentId = new mongoose.Types.ObjectId(filter.studentId);
        if (filter.studentIds && Array.isArray(filter.studentIds)) {
            matchQuery.studentId = { $in: filter.studentIds.map(id => new mongoose.Types.ObjectId(id)) };
        }
        if (filter.organizationId) matchQuery.organization = new mongoose.Types.ObjectId(filter.organizationId);
        if (filter.defaultGuardian !== undefined) matchQuery.defaultGuardian = filter.defaultGuardian;
        if (filter.relationship) matchQuery.relationship = filter.relationship;
        if (filter.parentId) matchQuery._id = new mongoose.Types.ObjectId(filter.parentId);

        const pipeline = [];

        if (filter.hostelId) {
            pipeline.push({
                $lookup: {
                    from: 'students',
                    localField: 'studentId',
                    foreignField: '_id',
                    as: 'studentsData'
                }
            });
            pipeline.push({
                $match: {
                    'studentsData.hostelId': new mongoose.Types.ObjectId(filter.hostelId)
                }
            });
        }

        pipeline.push({ $match: matchQuery });

        pipeline.push({
            $project: {
                _id: 0,
                id: '$_id',
                recipientType: { $literal: 'PARENT' },
                name: '$parentName',
                email: '$email',
                phone: '$phone',
                pushToken: '$pushToken',
                metadata: {
                    studentId: '$studentId'
                }
            }
        });

        return Parent.aggregate(pipeline).cursor({ batchSize: 500 });
    }
}

export class MentorResolver {
    async resolve(filter = {}) {
        let matchQuery = { role: 'mentor', isActive: true };

        const pipeline = [];

        if (filter.studentIds && Array.isArray(filter.studentIds)) {
            const Student = mongoose.model('Student');
            const MentorAssignment = mongoose.model('MentorAssignment');

            const students = await Student.find({
                _id: { $in: filter.studentIds.map(id => new mongoose.Types.ObjectId(id)) }
            }, 'batchId').lean();
            const batchIds = students.map(s => s.batchId).filter(Boolean);

            const activeAssignments = await MentorAssignment.find({
                batchId: { $in: batchIds },
                status: 'active'
            }, 'mentorId').lean();
            const mentorIds = activeAssignments.map(a => a.mentorId);

            matchQuery._id = { $in: mentorIds };
        } else if (filter.mentorIds && Array.isArray(filter.mentorIds)) {
            matchQuery._id = { $in: filter.mentorIds.map(id => new mongoose.Types.ObjectId(id)) };
        }

        pipeline.push({ $match: matchQuery });
        pipeline.push({
            $project: {
                _id: 0,
                id: '$_id',
                recipientType: { $literal: 'USER' },
                name: '$name',
                email: '$email',
                phone: '$phone',
                pushToken: '$pushToken',
                metadata: {
                    role: '$role',
                    organization: '$organization'
                }
            }
        });

        return User.aggregate(pipeline).cursor({ batchSize: 500 });
    }
}

export const userResolver = new UserResolver();
export const studentResolver = new StudentResolver();
export const parentResolver = new ParentResolver();
export const mentorResolver = new MentorResolver();
