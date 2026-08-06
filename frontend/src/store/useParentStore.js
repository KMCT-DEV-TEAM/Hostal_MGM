import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useParentStore = create(
    persist(
        (set) => ({
            _hasHydrated: false,
            setHasHydrated: (state) => set({ _hasHydrated: state }),
            
            activeStudentId: null,

            syncUser: (user) => set((state) => {
                const students = user?.students || [];
                
                if (students.length === 0) {
                    return { activeStudentId: null };
                }

                if (state.activeStudentId) {
                    const isValidActive = students.some(s => s._id === state.activeStudentId);
                    if (isValidActive) {
                        return {}; // state remains unchanged
                    }
                }
                
                // If they only have 1 student, auto-select it
                if (students.length === 1) {
                    return { activeStudentId: students[0]._id };
                }
                
                // Otherwise clear the selection so the modal opens
                return { activeStudentId: null };
            }),

            setActiveStudent: (id) => set({ activeStudentId: id }),
            clearSelection: () => set({ activeStudentId: null })
        }),
        {
            name: 'parent-store',
            partialize: (state) => ({ activeStudentId: state.activeStudentId }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            }
        }
    )
);
