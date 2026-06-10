import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import logo from '@/assets/images/logo/logo.png';
import AuthLayout from './components/AuthLayout';
import AuthSidebarSteps from './components/AuthSidebarSteps';
import AuthStepper from './components/AuthStepper';
import Button from '@/components/ui/Button';
import OtpInput from '@/components/ui/OtpInput';

const verifyOtpSchema = z.object({
    otp: z.string().length(6, { message: 'OTP must be exactly 6 digits' }),
});

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
                    <img
                        src={logo}
                        alt="KMCT Logo"
                        className="h-20 mb-10 mt-8 lg:mt-0 object-contain"
                    />

                    {/* Stepper */}
                    <AuthStepper currentStep={2} />

                    {/* Form Card */}
                    <div className="w-full bg-background lg:bg-white lg:rounded-xl lg:shadow-sm lg:px-12 lg:py-14 flex flex-col items-center">
                        <h1 className="text-2xl lg:text-[32px] font-bold text-primary mb-3 text-center">
                            Enter the code
                        </h1>
                        <p className="text-gray-500 text-[13px] lg:text-sm text-center mb-1 max-w-[280px] leading-relaxed">
                            A 6-digit code was send to <span className="text-primary font-medium">@usergmail.com</span>
                        </p>
                        <p className="text-red-500 text-[13px] text-center mb-8">
                            Expires in 10 minutes
                        </p>

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
                                className="w-full bg-secondary hover:bg-primary text-white font-medium py-3.5 rounded-lg transition-colors duration-200 text-sm mt-2"
                            >
                                Verify
                            </Button>
                        </form>

                        {/* Back to sign in - Desktop Only */}
                        <Link to="/admin/login" className="hidden lg:flex items-center gap-2 text-primary hover:opacity-80 transition-opacity text-[13px] font-medium mt-10">
                            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
                            Back to Sign in
                        </Link>
                    </div>
                </div>

                {/* Footer text */}
                <div className="mt-auto pt-5 pb-2">
                    <p className="text-[11px] text-gray-400">Powered by kmct.org</p>
                </div>
            </div>
        </AuthLayout>
    );
};

export default VerifyOtp;
