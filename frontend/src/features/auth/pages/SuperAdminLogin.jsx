import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import AuthLayout from '@/layouts/AuthLayout';
import AuthSidebarFeatures from '@/features/auth/components/AuthSidebarFeatures';
import AuthLogo from '@/features/auth/components/AuthLogo';
import AuthCard from '@/features/auth/components/AuthCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { superAdminSchema } from '@/features/auth/validation/loginSchema';
import { useLoginTimeout } from '@/hooks/useLoginTimeout';

const SuperAdminLogin = () => {
    const navigate = useNavigate();
    const { login } = useAuthStore();

    const { register, handleSubmit, watch, reset, setError, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(superAdminSchema)
    });

    const [lockoutTime, setLockoutTime] = useState(0);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (lockoutTime > 0) {
            const timer = setInterval(() => {
                setLockoutTime(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [lockoutTime]);

    useLoginTimeout(watch, reset, 60000); // 1 minute timeout

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                role: 'super_admin'
            };

            console.log("Payload being sent from SuperAdminLogin:", payload);

            await login(payload);

            showSuccessToast('Login Successful', 'Welcome to the Admin Dashboard');

            navigate('/dashboard');
        } catch (error) {
            console.log("error from the login page", error);
            const errorMessage = error?.message || 'Failed to sign in. Please check your credentials.';

            // Check for lockout time
            if (errorMessage.includes("Try again in") || errorMessage.includes("Account locked")) {
                const match = errorMessage.match(/(\d+)\s*seconds?/i);
                if (match && match[1]) {
                    setLockoutTime(parseInt(match[1]));
                }
            }

            showErrorToast('Login Failed', errorMessage);

            setError('root', {
                type: 'manual',
                message: errorMessage
            });
        }
    };

    return (
        <AuthLayout leftPanel={<AuthSidebarFeatures />}>
            <div className="w-full max-w-md">
                {/* Logo */}
                <AuthLogo isCentered={true} />

                {/* Login Card */}
                <AuthCard
                    variant="login"
                    title="Sign In"
                    subtitle="Access your admin dashboard"
                >
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <Input
                            type="email"
                            label="Email"
                            {...register('email')}
                            error={errors.email?.message}
                            placeholder="Enter Your Email"
                        />

                        <Input
                            type={showPassword ? 'text' : 'password'}
                            label="Password"
                            {...register('password')}
                            error={errors.password?.message}
                            placeholder="Enter your password"
                            endIcon={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            }
                        />

                        {errors.root && (
                            <div className="text-red-500 text-sm font-medium">
                                {errors.root.message}
                            </div>
                        )}

                        <Button type="submit" isLoading={isSubmitting} disabled={lockoutTime > 0 || isSubmitting}>
                            {lockoutTime > 0 ? `Try again in ${lockoutTime}s` : (isSubmitting ? 'Signing in...' : 'Sign In')}
                        </Button>
                    </form>
                </AuthCard>

                <p className="text-center text-xs text-text-secondary mt-6">
                    Powered by kmct.org
                </p>
            </div>
        </AuthLayout>
    )
}

export default SuperAdminLogin;
