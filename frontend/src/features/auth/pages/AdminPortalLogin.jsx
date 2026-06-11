import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthLayout from '@/layouts/AuthLayout';
import AuthSidebarFeatures from '@/features/auth/components/AuthSidebarFeatures';
import AuthLogo from '@/features/auth/components/AuthLogo';
import AuthCard from '@/features/auth/components/AuthCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { adminLoginSchema } from '@/features/auth/validation/loginSchema';

const AdminPortalLogin = () => {
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(adminLoginSchema)
    });

    const onSubmit = (data) => {
        console.log("Admin Login Data:", data);
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

                        <Button type="submit">
                            Sign In
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