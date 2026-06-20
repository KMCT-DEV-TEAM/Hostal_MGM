import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { User, Mail, Phone, Shield, Pencil, Check, X, Loader2 } from 'lucide-react';
import authService from '@/services/auth.service';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { useTranslation } from '@/hooks/useTranslation';

export default function Profile() {
    const { t } = useTranslation();
    const { user, updateUser } = useAuthStore();
    const [editingField, setEditingField] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, field: null });

    const formatRole = (role) => {
        if (!role) return '';
        return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };
    

    const handleEditClick = (field, currentValue) => {
        setEditingField(field);
        setEditValue(currentValue || '');
    };

    const handleCancelEdit = () => {
        setEditingField(null);
        setEditValue('');
    };

    const handleOpenConfirm = (field) => {
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
            showErrorToast('Failed', error?.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

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
                        <div className="w-24 h-24 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-[#0A437A] text-3xl font-bold">
                            {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                        </div>
                        {user?.isActive !== false && (
                            <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                    </div>

                    <div className="text-start">
                        <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
                        <p className="text-sm font-medium text-gray-500 mt-1 uppercase tracking-wider">{formatRole(user?.role)}</p>
                    </div>
                </div>

                {/* Information Sections */}
                <div className="p-0">

                    {/* Profile Info Section */}
                    <div className="border-b border-gray-100 last:border-0">
                        <div className="px-6 sm:px-8 py-5 bg-gray-50/50 flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{t('profile_info')}</h3>
                        </div>

                        <div className="px-6 sm:px-8 pb-6 text-sm">
                            <div className="grid grid-cols-1 sm:grid-cols-3 py-4 border-b border-gray-50 items-center gap-4">
                                <div className="text-gray-500 font-medium">{t('role')}</div>
                                <div className="sm:col-span-2">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold tracking-wide">
                                        <Shield className="w-3 h-3" />
                                        {formatRole(user?.role)}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 py-4 border-b border-gray-50 items-center gap-4">
                                <div className="text-gray-500 font-medium">{t('full_name')}</div>
                                <div className="sm:col-span-2 flex items-center justify-between group">
                                    {editingField === 'name' ? (
                                        <div className="flex items-center gap-2 w-full max-w-sm">
                                            <input
                                                type="text"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-[#0A437A] focus:ring-1 focus:ring-[#0A437A] disabled:opacity-50"
                                                autoFocus
                                                disabled={isSaving}
                                            />
                                            <button
                                                onClick={() => handleOpenConfirm('name')}
                                                disabled={isSaving}
                                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                                            >
                                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                disabled={isSaving}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-gray-900 font-semibold">{user?.name || t('not_provided')}</div>
                                            <button onClick={() => handleEditClick('name', user?.name)} className="p-1.5 text-gray-400 hover:text-[#0A437A] hover:bg-blue-50 rounded-md transition-all cursor-pointer">
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
                                        <div className="flex items-center gap-2 w-full max-w-sm">
                                            <input
                                                type="email"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-[#0A437A] focus:ring-1 focus:ring-[#0A437A] disabled:opacity-50"
                                                autoFocus
                                                disabled={isSaving}
                                            />
                                            <button
                                                onClick={() => handleOpenConfirm('email')}
                                                disabled={isSaving}
                                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                                            >
                                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                disabled={isSaving}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-gray-900 font-semibold flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-gray-400" />
                                                {user?.email || t('not_provided')}
                                            </div>
                                            {user?.role !== 'super_admin' && (
                                                <button onClick={() => handleEditClick('email', user?.email)} className="p-1.5 text-gray-400 hover:text-[#0A437A] hover:bg-blue-50 rounded-md transition-all cursor-pointer">
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
                                        <div className="flex items-center gap-2 w-full max-w-sm">
                                            <input
                                                type="text"
                                                value={editValue}
                                                maxLength={10}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    setEditValue(val);
                                                }}
                                                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-[#0A437A] focus:ring-1 focus:ring-[#0A437A] disabled:opacity-50"
                                                autoFocus
                                                disabled={isSaving}
                                                placeholder="Enter 10 digit number"
                                            />
                                            <button
                                                onClick={() => handleOpenConfirm('phone')}
                                                disabled={isSaving}
                                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                                            >
                                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                disabled={isSaving}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-gray-900 font-semibold flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                                {user?.phone || t('not_provided')}
                                            </div>
                                            <button onClick={() => handleEditClick('phone', user?.phone)} className="p-1.5 text-gray-400 hover:text-[#0A437A] hover:bg-blue-50 rounded-md transition-all cursor-pointer">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Account Settings Section */}
                    <div className="border-b border-gray-100 last:border-0">


                        <div className="px-6 sm:px-8 pb-6 text-sm">
                            <div className="grid grid-cols-1 sm:grid-cols-3 py-4 border-t border-gray-50 items-center gap-4">
                                <div className="text-gray-500 font-medium">{t('status')}</div>
                                <div className="sm:col-span-2">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${user?.isActive !== false ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${user?.isActive !== false ? 'bg-green-500' : 'bg-red-500'}`}></span>
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
        </div>
    );
}
