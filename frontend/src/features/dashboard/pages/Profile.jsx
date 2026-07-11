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

export default function Profile() {
    const { t } = useTranslation();
    const { user, updateUser } = useAuthStore();
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
                const response = await authService.getProfile();
                updateUser(response.user);
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

        if (field === 'phone' && editValue && editValue.trim() !== '') {
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
            updateUser(response.user);
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
            updateUser(response.user);
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

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto w-full animate-in fade-in duration-300">
            {/* Header Section */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">{t('my_profile')}</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your personal information and security</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

                {/* Profile Overview (Top Section) */}
                <div className="p-6 sm:p-8 border-b border-gray-100 bg-gray-50/50 flex items-center text-start gap-4">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-[#0A437A] text-3xl font-semibold">
                            {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                        </div>
                        {user?.isActive !== false && (
                            <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                    </div>

                    <div className="text-start">
                        <h2 className="text-2xl font-semibold text-gray-900">{user?.name}</h2>
                        <p className="text-sm font-medium text-gray-500 mt-1 uppercase tracking-wider">{formatRole(user?.role)}</p>
                    </div>
                </div>

                {/* Information Sections */}
                <div className="p-0">

                    {/* Profile Info Section */}
                    <div className="border-b border-gray-100 last:border-0">
                        <div className="px-6 sm:px-8 py-5 bg-gray-50/50 flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">{t('profile_info')}</h3>
                        </div>

                        <div className="px-6 sm:px-8 pb-6 text-sm">
                            <div className="grid grid-cols-1 sm:grid-cols-3 py-4 border-b border-gray-50 items-center gap-4">
                                <div className="text-gray-500 font-medium">{t('role')}</div>
                                <div className="sm:col-span-2">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-primary border border-blue-100 text-xs font-bold tracking-wide">
                                        <Shield className="w-3 h-3" />
                                        {formatRole(user?.role)}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 py-4 border-b border-gray-50 items-center gap-4">
                                <div className="text-gray-500 font-medium">{t('full_name')}</div>
                                <div className="sm:col-span-2 flex items-center justify-between group">
                                    {editingField === 'name' ? (
                                        <div className="flex flex-col gap-1 w-full max-w-sm">
                                            <div className="flex items-center gap-2 w-full">
                                                <input
                                                    type="text"
                                                    value={editValue}
                                                    pattern="[A-Za-z\s]+"
                                                    title="Only letters are allowed"
                                                    onChange={(e) => {
                                                        const originalVal = e.target.value;
                                                        const cleanVal = originalVal.replace(/[^a-zA-Z\s]/g, '');
                                                        if (originalVal !== cleanVal) {
                                                            setErrors(prev => ({ ...prev, name: 'Only letters are allowed' }));
                                                        } else {
                                                            setErrors(prev => ({ ...prev, name: '' }));
                                                        }
                                                        setEditValue(cleanVal);
                                                    }}
                                                    className={`w-full border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-[#0A437A] focus:ring-1 focus:ring-[#0A437A] disabled:opacity-50`}
                                                    autoFocus
                                                    disabled={isSaving}
                                                />
                                                <button
                                                    onClick={() => handleOpenConfirm('name')}
                                                    disabled={isSaving || (editValue && editValue.trim() === '')}
                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                                                >
                                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    disabled={isSaving}
                                                    className="p-1.5 text-danger hover:bg-danger/10 rounded-md transition-colors disabled:opacity-50"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            {errors.name && <p className="text-red-500 text-[10px]">{errors.name}</p>}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-gray-900 font-semibold">{user?.name || t('not_provided')}</div>
                                            <button onClick={() => handleEditClick('name', user?.name)} className="p-1.5 text-[#0A437A] rounded-md cursor-pointer">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 py-4 border-t border-gray-50 items-center gap-4">
                                <div className="text-gray-500 font-medium">{t('email_address')}</div>
                                <div className="sm:col-span-2 flex items-center justify-between group">
                                    {editingField === 'email' ? (
                                        <div className="flex flex-col gap-1 w-full max-w-sm">
                                            <div className="flex items-center gap-2 w-full">
                                                <input
                                                    type="email"
                                                    value={editValue}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const cleanVal = val.replace(/\s/g, '');
                                                        if (val !== cleanVal) {
                                                            setErrors(prev => ({ ...prev, email: 'Spaces are not allowed in email' }));
                                                        } else {
                                                            setErrors(prev => ({ ...prev, email: '' }));
                                                        }
                                                        setEditValue(cleanVal);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === ' ') {
                                                            e.preventDefault();
                                                            setErrors(prev => ({ ...prev, email: 'Spaces are not allowed in email' }));
                                                        }
                                                    }}
                                                    className={`w-full border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-[#0A437A] focus:ring-1 focus:ring-[#0A437A] disabled:opacity-50`}
                                                    autoFocus
                                                    disabled={isSaving}
                                                />
                                                <button
                                                    onClick={() => handleOpenConfirm('email')}
                                                    disabled={isSaving || (editValue && editValue.trim() === '')}
                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                                                >
                                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    disabled={isSaving}
                                                    className="p-1.5 text-danger hover:bg-danger/10 rounded-md transition-colors disabled:opacity-50"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            {errors.email && <p className="text-red-500 text-[10px]">{errors.email}</p>}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-gray-900 font-semibold flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-gray-400" />
                                                {user?.email || t('not_provided')}
                                            </div>
                                            {user?.role !== 'super_admin' && user?.role !== 'student' && user?.role !== 'parent' && (
                                                <button onClick={() => handleEditClick('email', user?.email)} className="p-1.5 text-[#0A437A] rounded-md cursor-pointer">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 py-4 border-t border-gray-50 items-center gap-4">
                                <div className="text-gray-500 font-medium">{t('phone_number')}</div>
                                <div className="sm:col-span-2 flex items-center justify-between group">
                                    {editingField === 'phone' ? (
                                        <div className="flex flex-col gap-1 w-full max-w-sm">
                                            <div className="flex items-center gap-2 w-full">
                                                <input
                                                    type="text"
                                                    value={editValue}
                                                    maxLength={10}
                                                    pattern="[0-9]{10}"
                                                    title="Please enter exactly 10 digits"
                                                    onChange={(e) => {
                                                        const originalVal = e.target.value;
                                                        const val = originalVal.replace(/\D/g, '');
                                                        if (originalVal !== val) {
                                                            setErrors(prev => ({ ...prev, phone: 'Only numbers are allowed' }));
                                                        } else {
                                                            setErrors(prev => ({ ...prev, phone: '' }));
                                                        }
                                                        if (val.length <= 10) {
                                                            setEditValue(val);
                                                        }
                                                    }}
                                                    className={`w-full border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-[#0A437A] focus:ring-1 focus:ring-[#0A437A] disabled:opacity-50`}
                                                    autoFocus
                                                    disabled={isSaving}
                                                    placeholder="Enter 10 digit number"
                                                />
                                                <button
                                                    onClick={() => handleOpenConfirm('phone')}
                                                    disabled={isSaving || (editValue && editValue.length !== 10)}
                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                                                >
                                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    disabled={isSaving}
                                                    className="p-1.5 text-danger hover:bg-danger/10 rounded-md transition-colors disabled:opacity-50"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            {errors.phone && <p className="text-red-500 text-[10px]">{errors.phone}</p>}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-gray-900 font-semibold flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                                {user?.phone || t('not_provided')}
                                            </div>
                                            <button onClick={() => handleEditClick('phone', user?.phone)} className="p-1.5 text-[#0A437A] rounded-md cursor-pointer">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            {(user?.role === 'warden' || user?.role === 'student') && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 py-4 border-t border-gray-50 items-center gap-4">
                                    <div className="text-gray-500 font-medium">{user?.role === 'warden' ? t('assigned_hostel') || 'Assigned Hostel' : 'Your Hostel'}</div>
                                    <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
                                        {user?.assignedHostels && user.assignedHostels.length > 0 ? (
                                            user.assignedHostels.map((hostel, index) => (
                                                <span key={index} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-100 text-xs font-semibold tracking-wide">
                                                    <Building className="w-3 h-3" />
                                                    {hostel.name} {hostel.code ? `(${hostel.code})` : ''}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-gray-400 text-sm italic">Not assigned to any hostel</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {user?.role === 'parent' && typeof user?.studentId === 'object' && user?.studentId && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 py-4 border-t border-gray-50 items-center gap-4">
                                    <div className="text-gray-500 font-medium">Linked Student</div>
                                    <div className="sm:col-span-2">
                                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm max-w-sm">
                                            <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                                                {user.studentId.profileImage ? (
                                                    <img src={user.studentId.profileImage} alt="student" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-5 h-5 text-gray-400" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-sm text-gray-900">{user.studentId.name || 'Not Available'}</div>
                                                <div className="text-[11px] font-medium text-gray-500 mt-0.5 uppercase tracking-wide">ID: {user.studentId.studentId || 'N/A'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Account Settings Section */}
                    <div className="border-b border-gray-100 last:border-0">


                        <div className="px-6 sm:px-8 pb-6 text-sm">
                            <div className="grid grid-cols-1 sm:grid-cols-3 py-4 border-t border-gray-50 items-center gap-4">
                                <div className="text-gray-500 font-medium">{t('status')}</div>
                                <div className="sm:col-span-2">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs uppercase tracking-wide ${user?.isActive !== false ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-danger border border-red-200'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${user?.isActive !== false ? 'bg-success' : 'bg-red-600'}`}></span>
                                        {user?.isActive !== false ? t('active') : t('inactive')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

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
        </div>
    );
}
