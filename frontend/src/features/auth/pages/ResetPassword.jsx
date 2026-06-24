import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import authService from '@/services/auth.service';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import AuthLayout from '@/layouts/AuthLayout';
import AuthSidebarSteps from '@/features/auth/components/AuthSidebarSteps';
import AuthStepper from '@/features/auth/components/AuthStepper';
import AuthLogo from '@/features/auth/components/AuthLogo';
import AuthCard from '@/features/auth/components/AuthCard';
import BackToSignIn from '@/features/auth/components/BackToSignIn';
import AuthFooter from '@/features/auth/components/AuthFooter';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { resetPasswordSchema } from '@/features/auth/validation/resetPasswordSchema';

const ResetPassword = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const resetToken = location.state?.resetToken;

    // Redirect if no reset token
    React.useEffect(() => {
        if (!resetToken) navigate('/forgot-password', { replace: true });
    }, [resetToken, navigate]);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(resetPasswordSchema)
    });

    const onSubmit = async (data) => {
        if (!resetToken) return;
        try {
            await authService.resetPassword({ resetToken, newPassword: data.password });
            showSuccessToast('Password Updated', 'Your password has been successfully reset. Please log in.');
            navigate('/user/login', { replace: true });
        } catch (error) {
            showErrorToast('Failed', error?.message || 'Failed to reset password.');
        }
    };

    return (
        <AuthLayout
            leftPanel={<AuthSidebarSteps currentStep={3} />}
            rightSideClassName="w-full lg:w-1/2 flex flex-col relative bg-background lg:bg-transparent overflow-hidden"
        >
            <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8">
                <div className="w-full max-w-[480px] flex flex-col items-center">
                    {/* Logo */}
                    <AuthLogo />

                    {/* Stepper */}
                    <AuthStepper currentStep={3} />

                    {/* Form Card */}
                    <AuthCard
                        title="Create new password"
                        subtitle="Choose a strong password to secure your account"
                    >
                        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                label="Password"
                                {...register('password')}
                                error={errors.password?.message}
                                placeholder="Enter your new password"
                                className="w-full px-4 py-3.5 rounded-lg border border-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-colors text-sm"
                                labelClassName="block text-[13px] font-medium text-text-primary"
                                containerClassName="space-y-2"
                                endIcon={
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="focus:outline-none hover:text-gray-600 transition-colors">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                }
                            />

                            <Input
                                type={showConfirmPassword ? 'text' : 'password'}
                                label="Confirm password"
                                {...register('confirmPassword')}
                                error={errors.confirmPassword?.message}
                                placeholder="Confirm your new password"
                                className="w-full px-4 py-3.5 rounded-lg border border-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-colors text-sm"
                                labelClassName="block text-[13px] font-medium text-text-primary"
                                containerClassName="space-y-2"
                                endIcon={
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="focus:outline-none hover:text-gray-600 transition-colors">
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                }
                            />

                            <Button
                                type='submit'
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Updating...' : 'Update Password'}
                            </Button>
                        </form>

                        {/* Back to sign in */}
                        <BackToSignIn to="/user/login" />
                    </AuthCard>
                </div>

                {/* Footer text */}
                <AuthFooter />
            </div>
        </AuthLayout>
    );
};

export default ResetPassword;
