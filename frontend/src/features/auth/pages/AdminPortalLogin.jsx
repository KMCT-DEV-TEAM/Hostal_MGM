import { Link, useNavigate } from 'react-router-dom';
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
import { adminLoginSchema } from '@/features/auth/validation/loginSchema';

const AdminPortalLogin = () => {
    const navigate = useNavigate();
    const { login } = useAuthStore();

    const { register, handleSubmit, setValue, watch, setError, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(adminLoginSchema),
        defaultValues: {
            role: 'admin'
        }
    });

    const currentRole = watch('role');

    const onSubmit = async (data) => {
        try {
            await login(data);
            const user = useAuthStore.getState().user;
            showSuccessToast('Login Successful', `Welcome to the ${user.role === 'admin' ? 'Admin' : 'Warden'} Dashboard`);
            navigate(getDashboardRoute(user.role));
        } catch (error) {
            console.log("error from the login page", error);
            const errorMessage = error?.message || 'Failed to sign in. Please check your credentials.';
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
                    subtitle="Access your dashboard"
                >
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-[13px] font-medium text-text-primary">
                                Login As
                            </label>

                            <div className="flex bg-gray-100 p-1 rounded-xl">
                                {['admin', 'warden'].map((role) => (
                                    <button
                                        key={role}
                                        type="button"
                                        onClick={() => setValue('role', role, { shouldValidate: true })}
                                        className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 capitalize ${currentRole === role
                                                ? 'bg-white text-text-primary shadow-sm'
                                                : 'text-text-secondary hover:text-text-primary hover:bg-gray-200/50'
                                            }`}
                                    >
                                        {role}
                                    </button>
                                ))}
                            </div>

                            <input type="hidden" {...register('role')} />

                            {errors.role && (
                                <p className="text-red-500 text-xs font-medium mt-1">{errors.role.message}</p>
                            )}
                        </div>

                        <Input
                            label="Email"
                            type="email"
                            {...register('email')}
                            error={errors.email?.message}
                            placeholder="Enter your email"
                        />

                        <Input
                            label="Password"
                            type="password"
                            {...register('password')}
                            error={errors.password?.message}
                            placeholder="Enter your password"
                        />

                        {errors.root && (
                            <div className="text-red-500 text-sm font-medium">
                                {errors.root.message}
                            </div>
                        )}

                        <Button type="submit" isLoading={isSubmitting}>
                            {isSubmitting ? 'Signing in...' : 'Sign In'}
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

export default AdminPortalLogin;