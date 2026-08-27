import { useAuthStore } from '@/store/useAuthStore';
import { useParentStore } from '@/store/useParentStore';
import { ROLES } from '@/constants/roles';

export const useActiveStudent = () => {
    const user = useAuthStore(state => state.user);
    const activeStudentId = useParentStore(state => state.activeStudentId);

    if (!user || user.role !== ROLES.PARENT || !user.students) {
        return { activeStudent: null, activeStudentId: null };
    }

    const activeStudent = user.students.find(s => (s.id || s._id) === activeStudentId) || null;
    
    return {
        activeStudent,
        activeStudentId: activeStudent?.id || activeStudent?._id || null
    };
};
