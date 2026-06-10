import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import logo from '@/assets/images/logo/logo.png';
import AuthLayout from '@/layouts/AuthLayout';
import AuthSidebarSteps from '@/features/auth/components/AuthSidebarSteps';
import AuthStepper from '@/features/auth/components/AuthStepper';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const resetPasswordSchema = z.object({
    password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
    confirmPassword: z.string().min(8, { message: 'Confirm password is required' }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

const ResetPassword = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(resetPasswordSchema)
    });

    const onSubmit = (data) => {
        console.log("Reset Password Data:", data);
        alert("Password updated successfully!");
    };

    return (
        <AuthLayout
            leftPanel={<AuthSidebarSteps currentStep={3} />}
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
                    <AuthStepper currentStep={3} />

                    {/* Form Card */}
                    <div className="w-full bg-background lg:bg-white lg:rounded-xl lg:shadow-sm lg:px-12 lg:py-14 flex flex-col items-center">
                        <h1 className="text-2xl lg:text-[32px] font-bold text-primary mb-3 text-center">
                            Create new password
                        </h1>
                        <p className="text-gray-500 text-[13px] lg:text-sm text-center mb-8 max-w-[280px] leading-relaxed">
                            Choose a strong password to secure your account
                        </p>

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
                                className="w-full bg-secondary hover:bg-primary text-white font-medium py-3.5 rounded-lg transition-colors duration-200 text-sm mt-2"
                            >
                                Update Password
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

export default ResetPassword;
