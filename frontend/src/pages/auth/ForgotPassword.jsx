import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import logo from '@/assets/images/logo/logo.png';
import AuthLayout from './components/AuthLayout';
import AuthSidebarSteps from './components/AuthSidebarSteps';
import AuthStepper from './components/AuthStepper';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const forgotPasswordSchema = z.object({
    email: z.string().min(1, { message: 'Email is required' }).email({ message: 'Invalid email address' }),
});

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
                    <img
                        src={logo}
                        alt="KMCT Logo"
                        className="h-20 mb-10 mt-8 lg:mt-0 object-contain"
                    />

                    {/* Stepper */}
                    <AuthStepper currentStep={1} />

                    {/* Form Card */}
                    <div className="w-full bg-background lg:bg-white lg:rounded-xl lg:shadow-sm lg:px-12 lg:py-14 flex flex-col items-center">
                        <h1 className="text-2xl lg:text-[32px] font-bold text-primary mb-3 text-center">
                            Forgot Password?
                        </h1>
                        <p className="text-gray-500 text-[13px] lg:text-sm text-center mb-8 max-w-[280px] leading-relaxed">
                            Enter your email and we'll send you a verification code
                        </p>

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
                                className="w-full bg-secondary hover:bg-primary text-white font-medium py-3.5 rounded-lg transition-colors duration-200 text-sm mt-2"
                            >
                                Send verification code
                            </Button>
                        </form>

                        {/* Back to sign in - Desktop Only */}
                        <button className="hidden lg:flex items-center gap-2 text-primary hover:opacity-80 transition-opacity text-[13px] font-medium mt-10">
                            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
                            Back to Sign in
                        </button>
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

export default ForgotPassword;