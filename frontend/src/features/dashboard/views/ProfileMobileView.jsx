import React, { useState } from 'react';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDateReadable } from '@/utils/formatters';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { useActiveStudent } from '@/hooks/useActiveStudent';
import { useParentStore } from '@/store/useParentStore';

import ProfileHeaderCard from '../components/profile/mobile/ProfileHeaderCard';
import QuickActions from '../components/profile/mobile/QuickActions';
import StudentSwitcherCard from '../components/profile/mobile/StudentSwitcherCard';
import ParentBasicInfoCard from '../components/profile/mobile/ParentBasicInfoCard';
import StudentAcademicCard from '../components/profile/mobile/StudentAcademicCard';
import StudentHostelCard from '../components/profile/mobile/StudentHostelCard';
import AccountSettingsCard from '../components/profile/mobile/AccountSettingsCard';

const ProfileMobileView = ({
    user,
    formatRole,
    editingField,
    editValue,
    setEditValue,
    isSaving,
    errors,
    setErrors,
    handleEditClick,
    handleCancelEdit,
    handleOpenConfirm
}) => {
    const { logout } = useAuthStore();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [studentToSwitch, setStudentToSwitch] = useState(null);
    const { activeStudent, activeStudentId } = useActiveStudent();
    const { setActiveStudent } = useParentStore();

    useLayoutConfig({
        header: {
            variant: "page",
            title: "Profile",
            showBack: true
        },
        footer: {
            visible: false
        }
    });

    const admissionNumber = user?.admissionNumber || 'No value';
    const course = user?.course || 'No value';
    const batch = user?.batch || 'No value';
    const year = user?.currentYear || 'No value';
    const organization = user?.organization || 'No value';
    const contactEmail = user?.email || 'No value';
    const contactNumber = user?.phone || 'No value';
    const hostel = user?.hostel?.name || 'No value';
    const block = user?.hostel?.code || 'No value';
    const room = user?.room || 'No value';
    const checkInDate = user?.checkIn ? formatDateReadable(user.checkIn) : 'No value';
    const warden = user?.hostel?.warden?.name || user?.warden?.name || (typeof user?.warden === 'string' ? user?.warden : 'No value');
    const wardenPhone = user?.hostel?.warden?.phone || user?.warden?.phone || user?.wardenPhone || '';

    const editProps = {
        editingField,
        editValue,
        setEditValue,
        isSaving,
        errors,
        setErrors,
        handleEditClick,
        handleCancelEdit,
        handleOpenConfirm
    };

    return (
        <div className="w-full min-h-full bg-background-secondary p-4 flex flex-col gap-4">
            
            <ProfileHeaderCard 
                user={user} 
                activeStudent={activeStudent} 
                admissionNumber={admissionNumber}
                course={course}
                batch={batch}
                year={year}
            />

            {user?.role === 'parent' ? (
                <>
                    <QuickActions role={user?.role} />
                    
                    <StudentSwitcherCard 
                        user={user} 
                        activeStudentId={activeStudentId} 
                        setActiveStudent={setActiveStudent} 
                        setStudentToSwitch={setStudentToSwitch}
                    />

                    <ParentBasicInfoCard 
                        user={user}
                        activeStudent={activeStudent}
                        contactEmail={contactEmail}
                        contactNumber={contactNumber}
                        editProps={editProps}
                    />
                </>
            ) : (
                <>
                    <QuickActions role={user?.role} />

                    <StudentAcademicCard 
                        user={user}
                        admissionNumber={admissionNumber}
                        organization={organization}
                        contactEmail={contactEmail}
                        contactNumber={contactNumber}
                        editProps={editProps}
                    />

                    <StudentHostelCard 
                        hostel={hostel}
                        block={block}
                        room={room}
                        checkInDate={checkInDate}
                        warden={warden}
                        wardenPhone={wardenPhone}
                    />
                </>
            )}

            <AccountSettingsCard setIsLogoutModalOpen={setIsLogoutModalOpen} />

            <ConfirmationModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={() => {
                    setIsLogoutModalOpen(false);
                    logout();
                }}
                title="Confirm Logout"
                message="Are you sure you want to logout from your account?"
                confirmText="Logout"
                confirmButtonClass="bg-danger text-white hover:bg-danger/90"
            />

            <ConfirmationModal
                isOpen={!!studentToSwitch}
                onClose={() => setStudentToSwitch(null)}
                onConfirm={() => {
                    setActiveStudent(studentToSwitch.id);
                    setStudentToSwitch(null);
                }}
                title="Switch Student"
                message={`Are you sure you want to view the dashboard for ${studentToSwitch?.name}?`}
                confirmText="Switch"
                confirmButtonClass="bg-primary text-white hover:bg-primary/90"
            />
        </div>
    );
};

export default ProfileMobileView;
