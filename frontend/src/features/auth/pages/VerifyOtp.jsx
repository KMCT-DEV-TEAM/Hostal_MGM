import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
    const { control, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(verifyOtpSchema),
        defaultValues: { otp: '' }
    });

    const onSubmit = (data) => {
        console.log("Verify OTP Data:", data);
        alert("OTP Verified successfully!");
    };

    return (
        <AuthLayout
            leftPanel={<AuthSidebarSteps currentStep={2} />}
            rightSideClassName="w-full lg:w-1/2 flex flex-col relative min-h-screen lg:min-h-0 bg-background lg:bg-transparent"
        >
            <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8 min-h-full">
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
                                    A 6-digit code was send to <span className="text-primary font-medium">@usergmail.com</span>
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
                                <button type="button" className="text-primary font-medium hover:underline">
                                    Resend the code
                                </button>
                            </p>

                            <Button
                                type='submit'
                            >
                                Verify
                            </Button>
                        </form>

                        {/* Back to sign in - Desktop Only */}
                        <BackToSignIn to="/admin/login" />
                    </AuthCard>
                </div>

                {/* Footer text */}
                <AuthFooter />
            </div>
        </AuthLayout>
    );
};

export default VerifyOtp;
