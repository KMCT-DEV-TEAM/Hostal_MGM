import { prisma } from '../../../config/prisma.js';
import { RecipientModel } from '../constants/notification.enums.js';

class AudienceResolverService {
    async resolve(target) {
        if (!target || !target.type) return [];
        const { type, filter } = target;

        switch (type.toUpperCase()) {
            case 'STUDENT':
                return await this.resolveStudents(filter);
            case 'PARENT':
                return await this.resolveParents(filter);
            case 'USER':
                return await this.resolveUsers(filter);
            default:
                return [];
        }
    }

    async resolveStudents(filter = {}) {
        const where = {};
        if (filter.courseId) where.courseId = filter.courseId;
        if (filter.departmentId) where.departmentId = filter.departmentId;
        if (filter.batchId) where.batchId = filter.batchId;
        if (filter.organizationId) where.organizationId = filter.organizationId;
        if (filter.isActive !== undefined) where.isActive = filter.isActive;
        if (filter.studentId) where.id = filter.studentId;
        if (filter.studentIds && filter.studentIds.length > 0) where.id = { in: filter.studentIds };
        if (filter.hostelId) {
            where.studentHostels = { some: { hostelId: filter.hostelId, status: 'ACTIVE' } };
        }

        const students = await prisma.student.findMany({
            where,
            select: { id: true, name: true, email: true, phone: true }
        });

        return students.map(s => ({
            id: s.id,
            recipientType: RecipientModel.STUDENT,
            name: s.name,
            email: s.email,
            phone: s.phone
        }));
    }

    async resolveParents(filter = {}) {
        const where = {};
        if (filter.parentId) where.id = filter.parentId;

        if (filter.studentId || (filter.studentIds && filter.studentIds.length > 0) || filter.organizationId || filter.relationship) {
            const studentParentsSome = {};
            if (filter.studentId) {
                studentParentsSome.studentId = filter.studentId;
            } else if (filter.studentIds && filter.studentIds.length > 0) {
                studentParentsSome.studentId = { in: filter.studentIds };
            }
            if (filter.organizationId) {
                studentParentsSome.student = { organizationId: filter.organizationId };
            }
            if (filter.relationship) {
                studentParentsSome.relationship = filter.relationship;
            }
            where.studentParents = { some: studentParentsSome };
        }

        const parents = await prisma.parent.findMany({
            where,
            select: { id: true, parentName: true, email: true, phone: true }
        });

        return parents.map(p => ({
            id: p.id,
            recipientType: RecipientModel.PARENT,
            name: p.parentName,
            email: p.email,
            phone: p.phone
        }));
    }

    async resolveUsers(filter = {}) {
        const where = {};
        if (filter.role) where.role = filter.role;
        if (filter.organizationId) where.organizationId = filter.organizationId;
        if (filter.isActive !== undefined) where.isActive = filter.isActive;
        if (filter.userId) where.id = filter.userId;
        if (filter.userIds && filter.userIds.length > 0) where.id = { in: filter.userIds };

        const users = await prisma.user.findMany({
            where,
            select: { id: true, name: true, email: true, phone: true, role: true }
        });

        return users.map(u => ({
            id: u.id,
            recipientType: RecipientModel.USER,
            name: u.name,
            email: u.email,
            phone: u.phone,
            role: u.role
        }));
    }
}

export const audienceResolverService = new AudienceResolverService();
