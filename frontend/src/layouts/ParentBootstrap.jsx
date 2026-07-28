import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useParentStore } from '@/store/useParentStore';
import { ROLES } from '@/constants/roles';
import StudentSelectionModal from '@/features/dashboard/components/parents/StudentSelectionModal';
import Loading from '@/components/ui/Loading';

const ParentBootstrap = () => {
    // 1. Subscribe to auth state
    const user = useAuthStore(state => state.user);
    const authLoading = useAuthStore(state => state.loading);

    // 2. Subscribe individually to parent store to avoid full store re-renders
    const activeStudentId = useParentStore(state => state.activeStudentId);
    const syncUser = useParentStore(state => state.syncUser);
    const setActiveStudent = useParentStore(state => state.setActiveStudent);
    const isHydrated = useParentStore(state => state._hasHydrated);

    // Sync state whenever the user changes (e.g. on login or refresh)
    useEffect(() => {
        if (user && user.role === ROLES.PARENT) {
            syncUser(user);
        }
    }, [user, syncUser]);

    // Prevent flashing: wait for both auth and Zustand persistence to load
    if (authLoading || !isHydrated) {
        return <Loading />;
    }

    const students = user?.students || [];

    // Empty state: Parent has no students linked
    if (students.length === 0) {
        return (
            <div className="flex-1 w-full h-full flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-md">
                    <h3 className="text-xl font-bold text-text-primary mb-2">No Students Linked</h3>
                    <p className="text-sm text-gray-500">You do not have any active students linked to your account. Please contact the administrator for assistance.</p>
                </div>
            </div>
        );
    }

    // If no active student is selected, force the selection modal to appear.
    const needsSelection = !activeStudentId;

    if (needsSelection) {
        return (
            <div className="flex-1 w-full h-full bg-gray-50 relative z-50">
                <StudentSelectionModal
                    students={students}
                    onSelect={setActiveStudent}
                />
            </div>
        );
    }

    return <Outlet />;
};

export default ParentBootstrap;
