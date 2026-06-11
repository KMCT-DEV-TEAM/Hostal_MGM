import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(forgotPasswordSchema)
    });

    const onSubmit = (data) => {
        console.log("Forgot Password Data:", data);
        alert("Verification code sent successfully!");
    };

    return (
        <AuthLayout
            leftPanel={<AuthSidebarSteps currentStep={1} />}
            rightSideClassName="w-full lg:w-1/2 flex flex-col relative min-h-screen lg:min-h-0 bg-background lg:bg-transparent"
        >
            <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8 min-h-full">
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
                            >
                                Send verification code
                            </Button>
                        </form>

                        {/* Back to sign in - Desktop Only */}
                        <BackToSignIn />
                    </AuthCard>
                </div>

                {/* Footer text */}
                <AuthFooter />
            </div>
        </AuthLayout>
    );
};

export default ForgotPassword;