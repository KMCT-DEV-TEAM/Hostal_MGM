import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/store/useAuthStore';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { getDashboardRoute } from '@/utils/getDashboardRoute';
import AuthLayout from '@/layouts/AuthLayout';
import AuthSidebarFeatures from '@/features/auth/components/AuthSidebarFeatures';
import AuthLogo from '@/features/auth/components/AuthLogo';
import AuthCard from '@/features/auth/components/AuthCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { maintenanceStaffLoginSchema } from '@/features/auth/validation/loginSchema';
import { useLoginTimeout } from '@/hooks/useLoginTimeout';

const MaintenanceStaffLogin = () => {
    const navigate = useNavigate();
    const { login } = useAuthStore();

    const { register, handleSubmit, watch, reset, setError, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(maintenanceStaffLoginSchema),
        defaultValues: {
            role: 'maintenance_staff'
        }
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
            await login(data);
            const user = useAuthStore.getState().user;
            showSuccessToast('Login Successful', `Welcome to the Maintenance Staff Dashboard`);
            navigate(getDashboardRoute(user.role));
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
                    subtitle="Maintenance Staff Portal"
                >
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <input type="hidden" {...register('role')} />

                        <Input
                            label="Email"
                            type="email"
                            {...register('email')}
                            error={errors.email?.message}
                            placeholder="Enter your email"
                        />

                        <Input
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            {...register('password')}
                            error={errors.password?.message}
                            placeholder="Enter your password"
                            endIcon={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="focus:outline-none hover:text-gray-600 transition-colors"
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

                    <p className="text-center text-xs text-text-secondary mt-6">
                        Forgot Password ?
                        <Link to="/contact-administrator" className='ml-1 text-accent font-medium'>
                            Contact Administrator
                        </Link>
                    </p>
                </AuthCard>
            </div>
        </AuthLayout>
    )
}

export default MaintenanceStaffLogin;
