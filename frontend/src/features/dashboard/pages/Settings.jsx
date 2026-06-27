import React, { useState } from 'react';
import { Shield, Key, Loader2, Bell, Globe } from 'lucide-react';
import authService from '@/services/auth.service';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from '@/hooks/useTranslation';
import SettingsSkeleton from '@/components/ui/SettingsSkeleton';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function Settings() {
    const { user, updateUser } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);
    const { t } = useTranslation();
    const [passwords, setPasswords] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    
    // Preferences State
    const [notifications, setNotifications] = useState({
        emailAlerts: user?.settings?.notifications?.emailAlerts ?? true,
        smsAlerts: user?.settings?.notifications?.smsAlerts ?? false
    });
    const [preferences, setPreferences] = useState({
        language: user?.settings?.preferences?.language ?? 'en'
    });

    React.useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await authService.getProfile();
                updateUser(response.user);
                
                const fetchedSettings = response.user?.settings;
                if (fetchedSettings) {
                    if (fetchedSettings.notifications) {
                        setNotifications({
                            emailAlerts: fetchedSettings.notifications.emailAlerts ?? true,
                            smsAlerts: fetchedSettings.notifications.smsAlerts ?? false
                        });
                    }
                    if (fetchedSettings.preferences) {
                        setPreferences({
                            language: fetchedSettings.preferences.language ?? 'en'
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to fetch profile", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [updateUser]);

    const handlePasswordChange = (e) => {
        setPasswords(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleToggleNotification = async (key) => {
        const newValue = !notifications[key];
        setNotifications(prev => ({ ...prev, [key]: newValue }));
        
        try {
            const updatedSettings = {
                notifications: { ...notifications, [key]: newValue },
                preferences
            };
            const response = await authService.updateProfile({ settings: updatedSettings });
            updateUser(response.user);
            showSuccessToast('Settings Updated', 'Notification preferences saved');
        } catch (error) {
            setNotifications(prev => ({ ...prev, [key]: !newValue }));
            showErrorToast('Failed', 'Could not save notification preferences');
        }
    };

    const handlePreferenceChange = async (e) => {
        const { name, value } = e.target;
        const oldVal = preferences[name];
        setPreferences(prev => ({ ...prev, [name]: value }));
        
        try {
            const updatedSettings = {
                notifications,
                preferences: { ...preferences, [name]: value }
            };
            const response = await authService.updateProfile({ settings: updatedSettings });
            updateUser(response.user);
            showSuccessToast('Settings Updated', 'Preferences saved');
        } catch (error) {
            setPreferences(prev => ({ ...prev, [name]: oldVal }));
            showErrorToast('Failed', 'Could not save preferences');
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        
        if (passwords.newPassword !== passwords.confirmPassword) {
            showErrorToast('Error', 'New passwords do not match');
            return;
        }

        if (passwords.newPassword.length < 6) {
            showErrorToast('Error', 'New password must be at least 6 characters long');
            return;
        }

        if (user?.role === 'warden') {
            setIsSaving(true);
            try {
                await authService.verifyPassword({ password: passwords.oldPassword });
                setIsConfirmModalOpen(true);
            } catch (error) {
                showErrorToast('Error', 'Incorrect current password');
            } finally {
                setIsSaving(false);
            }
            return;
        }

        setIsSaving(true);
        try {
            await authService.changePassword({
                oldPassword: passwords.oldPassword,
                newPassword: passwords.newPassword
            });
            showSuccessToast('Success', 'Password changed successfully');
            setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            showErrorToast('Failed', error?.response?.data?.message || 'Failed to change password');
        } finally {
            setIsSaving(false);
        }
    };

    const handleConfirmWardenPasswordRequest = async () => {
        setIsSaving(true);
        try {
            await authService.submitPasswordRequest({
                email: user.email,
                newPassword: passwords.newPassword,
                confirmPassword: passwords.confirmPassword
            });
            showSuccessToast('Request Sent', 'Password change request submitted to Super Admin');
            setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
            setIsConfirmModalOpen(false);
        } catch (error) {
            showErrorToast('Failed', error?.response?.data?.message || 'Failed to submit request');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading || !user) {
        return <SettingsSkeleton />;
    }

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto w-full animate-in fade-in duration-300">
            {/* Header Section */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">{t('settings_title')}</h1>
                <p className="text-sm text-gray-500 mt-1">{t('settings_desc')}</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Security Section */}
                <div className="border-b border-gray-100 last:border-0">
                    <div className="px-6 sm:px-8 py-5 bg-gray-50/50 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{t('security')}</h3>
                    </div>

                    <div className="px-6 sm:px-8 py-6">
                        <form onSubmit={handleUpdatePassword} className="max-w-md space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('current_password')}</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Key className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        name="oldPassword"
                                        value={passwords.oldPassword}
                                        onChange={handlePasswordChange}
                                        required
                                        className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                        placeholder=""
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('new_password')}</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Shield className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={passwords.newPassword}
                                        onChange={handlePasswordChange}
                                        required
                                        className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                        placeholder=""
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('confirm_password')}</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Shield className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={passwords.confirmPassword}
                                        onChange={handlePasswordChange}
                                        required
                                        className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                        placeholder=""
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isSaving || !passwords.oldPassword || !passwords.newPassword || !passwords.confirmPassword}
                                    className="flex items-center justify-center gap-2 w-full sm:w-auto bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm font-medium"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('update_password')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Notifications Section */}
                <div className="border-b border-gray-100 last:border-0">
                    <div className="px-6 sm:px-8 py-5 bg-gray-50/50 flex items-center gap-2">
                        <Bell className="w-4 h-4 text-gray-400" />
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{t('notifications')}</h3>
                    </div>

                    <div className="px-6 sm:px-8 py-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-medium text-gray-900">{t('email_alerts')}</h4>
                                <p className="text-sm text-gray-500">{t('email_alerts_desc')}</p>
                            </div>
                            <button 
                                onClick={() => handleToggleNotification('emailAlerts')}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${notifications.emailAlerts ? 'bg-primary' : 'bg-gray-200'}`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifications.emailAlerts ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-medium text-gray-900">{t('sms_alerts')}</h4>
                                <p className="text-sm text-gray-500">{t('sms_alerts_desc')}</p>
                            </div>
                            <button 
                                onClick={() => handleToggleNotification('smsAlerts')}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${notifications.smsAlerts ? 'bg-primary' : 'bg-gray-200'}`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifications.smsAlerts ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preferences Section */}
                <div>
                    <div className="px-6 sm:px-8 py-5 bg-gray-50/50 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{t('preferences')}</h3>
                    </div>

                    <div className="px-6 sm:px-8 py-6 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('language')}</label>
                                <select 
                                    name="language"
                                    value={preferences.language}
                                    onChange={handlePreferenceChange}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                >
                                    <option value="en">English (US)</option>
                                    <option value="ml">Malayalam (മലയാളം)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmWardenPasswordRequest}
                title="Submit Password Request"
                message="As a warden, your password change requires Super Admin approval. Are you sure you want to submit this request?"
                confirmText="Submit Request"
                isDestructive={false}
            />
        </div>
    );
}
