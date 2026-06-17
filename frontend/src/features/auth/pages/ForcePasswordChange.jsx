import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '@/layouts/AuthLayout';
import AuthSidebarFeatures from '@/features/auth/components/AuthSidebarFeatures';
import AuthLogo from '@/features/auth/components/AuthLogo';
import AuthCard from '@/features/auth/components/AuthCard';
import AuthFooter from '@/features/auth/components/AuthFooter';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { forcePasswordChangeSchema } from '@/features/auth/validation/forcePasswordChangeSchema';
import authService from '@/services/auth.service';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { useAuthStore } from '@/store/useAuthStore';

const ForcePasswordChange = () => {
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const navigate = useNavigate();
    const { user, init } = useAuthStore();

    const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(forcePasswordChangeSchema)
    });

    const onSubmit = async (data) => {
        try {
            await authService.changePassword({
                oldPassword: data.oldPassword,
                newPassword: data.newPassword
            });

            showSuccessToast('Success', 'Password changed successfully!');

            // Re-fetch profile to update temppass status in the store
            await init();

            // Redirect to dashboard
            navigate('/dashboard', { replace: true });
        } catch (error) {
            showErrorToast('Failed', error?.message || 'Failed to update password');
            setError('root', {
                type: 'manual',
                message: error?.message || 'Failed to update password'
            });
        }
    };

    return (
        <AuthLayout
            leftPanel={<AuthSidebarFeatures />}
            rightSideClassName="w-full lg:w-1/2 flex flex-col relative min-h-screen lg:min-h-0 bg-background lg:bg-transparent"
        >
            <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8 min-h-full">
                <div className="w-full max-w-[500px] flex flex-col items-center">
                    {/* Logo */}
                    <AuthLogo />

                    {/* Form Card */}
                    <AuthCard
                        title="Change Password"
                        subtitle='Create a strong password to keep your account safe'
                    >
                        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5">
                            <Input
                                type={showOldPassword ? 'text' : 'password'}
                                label="Current Password"
                                {...register('oldPassword')}
                                error={errors.oldPassword?.message}
                                placeholder="Enter your current temporary password"
                                endIcon={
                                    <button type="button" onClick={() => setShowOldPassword(!showOldPassword)} className="focus:outline-none hover:text-gray-600 transition-colors">
                                        {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                }
                            />

                            <Input
                                type={showNewPassword ? 'text' : 'password'}
                                label="New Password"
                                {...register('newPassword')}
                                error={errors.newPassword?.message}
                                placeholder="Enter your new password"
                                endIcon={
                                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="focus:outline-none hover:text-gray-600 transition-colors">
                                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                }
                            />

                            <Input
                                type={showConfirmPassword ? 'text' : 'password'}
                                label="Confirm New Password"
                                {...register('confirmPassword')}
                                error={errors.confirmPassword?.message}
                                placeholder="Confirm your new password"
                                endIcon={
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="focus:outline-none hover:text-gray-600 transition-colors">
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                }
                            />

                            {errors.root && (
                                <div className="text-red-500 text-sm font-medium">
                                    {errors.root.message}
                                </div>
                            )}

                            <Button
                                type='submit'
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Updating...' : 'Update Password'}
                            </Button>
                        </form>
                    </AuthCard>
                </div>

                {/* Footer text */}
                <AuthFooter />
            </div>
        </AuthLayout>
    );
};

export default ForcePasswordChange;
