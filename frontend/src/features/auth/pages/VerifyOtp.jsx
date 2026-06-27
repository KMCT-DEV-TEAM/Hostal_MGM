import React from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import Button from '@/components/ui/Button';
import OtpInput from '@/components/ui/OtpInput';
import { verifyOtpSchema } from '@/features/auth/validation/verifyOtpSchema';

const VerifyOtp = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    // Redirect back if no email
    React.useEffect(() => {
        if (!email) navigate('/forgot-password', { replace: true });
    }, [email, navigate]);

    const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(verifyOtpSchema),
        defaultValues: { otp: '' }
    });

    const [isResending, setIsResending] = React.useState(false);

    const handleResend = async () => {
        if (!email) return;
        setIsResending(true);
        try {
            await authService.sendOtp({ email });
            showSuccessToast('OTP Resent', 'Check your email for the new verification code.');
        } catch (error) {
            showErrorToast('Failed', error?.message || 'Failed to resend OTP.');
        } finally {
            setIsResending(false);
        }
    };

    const onSubmit = async (data) => {
        if (!email) return navigate('/forgot-password', { replace: true });
        try {
            const res = await authService.verifyOtp({ email, otp: data.otp });
            showSuccessToast('OTP Verified', 'Please set a new password.');
            navigate('/reset-password', { state: { resetToken: res.data?.resetToken }, replace: true });
        } catch (error) {
            showErrorToast('Failed', error?.message || 'Invalid OTP.');
        }
    };

    return (
        <AuthLayout
            leftPanel={<AuthSidebarSteps currentStep={2} />}
            rightSideClassName="w-full lg:w-1/2 flex flex-col relative bg-background lg:bg-transparent overflow-hidden"
        >
            <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8">
                <div className="w-full max-w-[480px] flex flex-col items-center">
                    {/* Logo */}
                    <AuthLogo />

                    {/* Stepper */}
                    <AuthStepper currentStep={2} />

                    {/* Form Card */}
                    <AuthCard
                        title="Enter the code"
                        subtitle={
                            <>
                                <p className="text-gray-500 text-[13px] lg:text-sm text-center mb-1 max-w-[280px] leading-relaxed">
                                    A 6-digit code was sent to <span className="text-primary font-medium">{email || 'your email'}</span>
                                </p>
                                <p className="text-red-500 text-[13px] text-center">
                                    Expires in 10 minutes
                                </p>
                            </>
                        }
                    >
                        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-8 flex flex-col items-center">
                            <div className="w-full max-w-sm">
                                <Controller
                                    name="otp"
                                    control={control}
                                    render={({ field }) => (
                                        <OtpInput
                                            value={field.value}
                                            onChange={field.onChange}
                                            length={6}
                                            error={!!errors.otp}
                                        />
                                    )}
                                />
                                {errors.otp && (
                                    <p className="text-red-500 text-xs mt-2 text-center">{errors.otp.message}</p>
                                )}
                            </div>

                            <p className="text-center text-[13px] text-text-secondary">
                                Didn't receive it ?{' '}
                                <button type="button" onClick={handleResend} disabled={isResending} className="text-primary font-medium hover:underline disabled:opacity-50">
                                    {isResending ? 'Sending...' : 'Resend the code'}
                                </button>
                            </p>

                            <Button
                                type='submit'
                                isLoading={isSubmitting}
                            >
                                {isSubmitting ? 'Verifying...' : 'Verify'}
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

export default VerifyOtp;
