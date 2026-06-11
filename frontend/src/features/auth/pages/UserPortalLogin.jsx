import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthLayout from '@/layouts/AuthLayout';
import AuthSidebarFeatures from '@/features/auth/components/AuthSidebarFeatures';
import AuthLogo from '@/features/auth/components/AuthLogo';
import AuthCard from '@/features/auth/components/AuthCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { userLoginSchema } from '@/features/auth/validation/loginSchema';

const UserPortalLogin = () => {
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(userLoginSchema)
    });

    const onSubmit = (data) => {
        console.log("User Login Data:", data);
        alert("Form submitted successfully!");
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

                        <Button type="submit">
                            Sign In
                        </Button>
                    </form>
                </AuthCard>
            </div>
        </AuthLayout>
    )
}

export default UserPortalLogin;