import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/store/useAuthStore';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
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

    const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(adminLoginSchema)
    });

    const onSubmit = async (data) => {
        try {
            const payload = {
                email: data.adminId,
                password: data.password
            };
            await login(payload);
            showSuccessToast('Login Successful', 'Welcome to the Admin Dashboard');
            navigate('/admin/dashboard'); 
        } catch (error) {
            console.log("error from the login page", error);
            showErrorToast('Login Failed', error?.message || 'Failed to sign in. Please check your credentials.');
            setError('root', {
                type: 'manual',
                message: error?.message || 'Failed to sign in. Please check your credentials.'
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
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <Input
                            label="Email"
                            type="email"
                            {...register('adminId')}
                            error={errors.adminId?.message}
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

                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>

                    <p className="text-center text-xs text-text-secondary mt-6">
                        Having Trouble ?
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