import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { User, Mail, Phone, Shield, Pencil, Check, X, Loader2, Building } from 'lucide-react';
import authService from '@/services/auth.service';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import EmailVerificationModal from '@/components/ui/EmailVerificationModal';
import PasswordConfirmModal from '@/components/ui/PasswordConfirmModal';
import ProfileSkeleton from '@/components/ui/ProfileSkeleton';
import { useTranslation } from '@/hooks/useTranslation';
import { initSocket } from '@/services/socket.service';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import ProfileDesktopView from '../views/ProfileDesktopView';
import ProfileMobileView from '../views/ProfileMobileView';
import { ROLES } from '@/constants/roles';
export default function Profile() {
    const { t } = useTranslation();
    const { user, updateUser } = useAuthStore();
    const { isMobile } = useBreakpoint();

    const [isLoading, setIsLoading] = useState(true);
    const [editingField, setEditingField] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, field: null });
    const [isEmailVerifyModalOpen, setIsEmailVerifyModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
    const [otpModalError, setOtpModalError] = useState('');

    const formatRole = (role) => {
        if (!role) return '';
        return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    React.useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await authService.getFullProfile();
                updateUser({ ...response.user, ...response.roleData });
            } catch (error) {
                console.error("Failed to fetch profile", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();

        const socket = initSocket();

        const handleProfileEvent = () => {
            fetchProfile();
        };

        socket.on('profileUpdated', handleProfileEvent);

        return () => {
            socket.off('profileUpdated', handleProfileEvent);
        };
    }, [updateUser]);

    const handleEditClick = (field, currentValue) => {
        setEditingField(field);
        setEditValue(currentValue || '');
    };

    const handleCancelEdit = () => {
        setEditingField(null);
        setEditValue('');
        setErrors({});
    };

    const handleOpenConfirm = async (field) => {
        if (field === 'name' && (!editValue || editValue.trim() === '')) {
            showErrorToast('Error', 'Name cannot be empty');
            return;
        }

        if (field === 'phone') {
            if (!editValue || editValue.trim() === '') {
                showErrorToast('Error', 'Phone number cannot be empty');
                return;
            }
            const phoneRegex = /^\d{10}$/;
            if (!phoneRegex.test(editValue)) {
                showErrorToast('Invalid Phone', 'Phone number must be exactly 10 digits');
                return;
            }
        }

        if (field === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(editValue)) {
                showErrorToast('Invalid Email', 'Please enter a valid email address');
                return;
            }
            if (editValue === user?.email) {
                showErrorToast('Error', 'New email must be different from current email');
                return;
            }

            setIsPasswordModalOpen(true);
            return;
        }

        setConfirmConfig({ isOpen: true, field });
    };

    const handleConfirmSave = async () => {
        const field = confirmConfig.field;
        if (!field) return;

        setIsSaving(true);
        try {
            const payload = { [field]: editValue };
            const response = await authService.updateProfile(payload);
            updateUser({ ...user, ...response.user });
            showSuccessToast('Success', 'Profile updated successfully');
            setEditingField(null);
            setConfirmConfig({ isOpen: false, field: null });
        } catch (error) {
            showErrorToast('Failed', error?.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleVerifyPasswordForEmailChange = async (password) => {
        setIsVerifyingPassword(true);
        try {
            await authService.verifyPassword({ password });

            setIsPasswordModalOpen(false);
            setIsSaving(true);

            await authService.requestEmailChange({ newEmail: editValue });
            showSuccessToast('OTP Sent', 'Check your new email for the verification code');
            setIsEmailVerifyModalOpen(true);
        } catch (error) {
            const errorMsg = error?.message || 'Incorrect password';
            if (errorMsg.toLowerCase().includes('otp already sent')) {
                setOtpModalError(errorMsg);
                setIsEmailVerifyModalOpen(true);
            } else {
                showErrorToast('Verification Failed', errorMsg);
            }
        } finally {
            setIsVerifyingPassword(false);
            setIsSaving(false);
        }
    };


    const handleVerifyEmail = async (otp) => {
        setIsSaving(true);
        setOtpModalError('');
        try {
            const response = await authService.verifyEmailChange({ newEmail: editValue, otp });
            updateUser({ ...user, ...response.user });
            showSuccessToast('Success', 'Email updated successfully');
            setEditingField(null);
            setIsEmailVerifyModalOpen(false);
        } catch (error) {
            setOtpModalError(error?.message || 'Invalid OTP.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading || !user) {
        return <ProfileSkeleton />;
    }

    const viewProps = {
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
    };

    return (
        <>
            {isMobile && (user?.role === ROLES.STUDENT || user?.role === ROLES.PARENT) ? (
                <ProfileMobileView {...viewProps} />
            ) : (
                <ProfileDesktopView {...viewProps} />
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig({ isOpen: false, field: null })}
                onConfirm={handleConfirmSave}
                title={`Confirm ${confirmConfig.field === 'name' ? 'Name' : confirmConfig.field === 'phone' ? 'Phone' : 'Email'} Update`}
                message={`Are you sure you want to update your ${confirmConfig.field}?`}
                confirmText="Save Changes"
                confirmButtonClass="bg-primary text-white hover:bg-primary/90"
                isSubmitting={isSaving}
            />

            {/* Email Verification Modal */}
            <EmailVerificationModal
                isOpen={isEmailVerifyModalOpen}
                onClose={() => setIsEmailVerifyModalOpen(false)}
                onVerify={handleVerifyEmail}
                email={editValue}
                isSubmitting={isSaving}
                initialError={otpModalError}
            />
            <PasswordConfirmModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onConfirm={handleVerifyPasswordForEmailChange}
                isVerifying={isVerifyingPassword}
                title="Security Verification"
                subtitle="Please enter your password to change your email address."
            />
        </ >
    );
}
