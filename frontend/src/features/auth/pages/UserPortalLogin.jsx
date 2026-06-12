import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import AuthLayout from '@/layouts/AuthLayout';
import AuthSidebarFeatures from '@/features/auth/components/AuthSidebarFeatures';
import AuthLogo from '@/features/auth/components/AuthLogo';
import AuthCard from '@/features/auth/components/AuthCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { userLoginSchema } from '@/features/auth/validation/loginSchema';

const UserPortalLogin = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(userLoginSchema)
    });

    const onSubmit = async (data) => {
        try {
            await login(data);
            showSuccessToast('Login Successful', 'Welcome to the Dashboard');
            navigate('/user/dashboard'); 
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
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <Input
                            type="email"
                            label="Email"
                            {...register('email')}
                            error={errors.email?.message}
                            placeholder="Enter Your Email"
                        />

                        <div>
                            <Input
                                type="password"
                                label="Password"
                                {...register('password')}
                                error={errors.password?.message}
                                placeholder="Enter your password"
                            />
                            <div className="flex justify-end mt-2">
                                <Link
                                    to="/admin/login"
                                    className="text-sm text-primary hover:underline"
                                >
                                    Forgot Password?
                                </Link>
                            </div>
                        </div>

                        {errors.root && (
                            <div className="text-red-500 text-sm font-medium mt-2">
                                {errors.root.message}
                            </div>
                        )}

                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>
                </AuthCard>
            </div>
        </AuthLayout>
    )
}

export default UserPortalLogin;