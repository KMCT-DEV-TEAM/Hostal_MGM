import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
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
import { forgotPasswordSchema } from '@/features/auth/validation/forgotPasswordSchema';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(forgotPasswordSchema)
    });

    const onSubmit = async (data) => {
        try {
            await authService.sendOtp({ email: data.email });
            showSuccessToast('OTP Sent', 'Check your email for the verification code.');
            navigate('/verify-otp', { state: { email: data.email }, replace: true });
        } catch (error) {
            const errorMsg = error?.message || 'Please try again.';
            if (errorMsg.toLowerCase().includes('otp already sent')) {
                navigate('/verify-otp', { state: { email: data.email, initialError: errorMsg }, replace: true });
            } else {
                showErrorToast('Failed', errorMsg);
                setError('email', {
                    type: 'manual',
                    message: errorMsg
                });
            }
        }
    };

    return (
        <AuthLayout
            leftPanel={<AuthSidebarSteps currentStep={1} />}
            rightSideClassName="w-full lg:w-1/2 flex flex-col relative bg-background lg:bg-transparent overflow-hidden"
        >
            <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8">
                <div className="w-full max-w-[480px] flex flex-col items-center">
                    {/* Logo */}
                    <AuthLogo />

                    {/* Stepper */}
                    <AuthStepper currentStep={1} />

                    {/* Form Card */}
                    <AuthCard
                        title="Forgot Password?"
                        subtitle="Enter your email and we'll send you a verification code"
                    >
                        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
                            <Input
                                type="email"
                                label="Email"
                                {...register('email')}
                                error={errors.email?.message}
                                placeholder="Enter Your Email"
                                className="w-full px-4 py-3.5 rounded-lg border border-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-colors text-sm"
                                labelClassName="block text-[13px] font-medium text-text-primary"
                                containerClassName="space-y-2"
                            />

                            <Button
                                type='submit'
                                isLoading={isSubmitting}
                            >
                                {isSubmitting ? 'Sending...' : 'Send verification code'}
                            </Button>
                        </form>

                        {/* Back to sign in */}
                        <BackToSignIn onClick={() => navigate(-1)} />
                    </AuthCard>
                </div>

                {/* Footer text */}
                <AuthFooter />
            </div>
        </AuthLayout>
    );
};

export default ForgotPassword;