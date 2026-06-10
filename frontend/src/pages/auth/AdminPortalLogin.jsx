import logo from '@/assets/images/logo/logo.png';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import AuthLayout from './components/AuthLayout';
import AuthSidebarFeatures from './components/AuthSidebarFeatures';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

// Validation Schema
const loginSchema = z.object({
    adminId: z.string().min(1, { message: 'Admin ID is required' }),
    password: z.string().min(1, { message: 'Password is required' }),
});

const AdminPortalLogin = () => {
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(loginSchema)
    });

    const onSubmit = (data) => {
        console.log("Admin Login Data:", data);
        alert("Form submitted successfully!");
    };

    return (
        <AuthLayout leftPanel={<AuthSidebarFeatures />}>
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex justify-center lg:mb-8 mb-4">
                    <img
                        src={logo}
                        alt="Logo"
                        className="h-20 w-auto"
                    />
                </div>

                {/* Login Card */}
                <div className=" rounded-xl lg:shadow-sm lg:p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-primary">
                            Sign In
                        </h2>

                        <p className="text-text-secondary mt-2">
                            Access your admin dashboard
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <Input
                            label="Admin ID"
                            {...register('adminId')}
                            error={errors.adminId?.message}
                            placeholder="Enter your ID (default: admin123)"
                        />

                        <Input
                            label="Password"
                            type="password"
                            {...register('password')}
                            error={errors.password?.message}
                            placeholder="Password (default: password123)"
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
                </div>
            </div>
        </AuthLayout>
    )
}

export default AdminPortalLogin;