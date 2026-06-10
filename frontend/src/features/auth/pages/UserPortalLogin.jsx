import logo from '@/assets/images/logo/logo.png';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import AuthLayout from '@/layouts/AuthLayout';
import AuthSidebarFeatures from '@/features/auth/components/AuthSidebarFeatures';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const userLoginSchema = z.object({
    email: z.string().min(1, { message: 'Email is required' }).email({ message: 'Invalid email address' }),
    password: z.string().min(1, { message: 'Password is required' }),
});

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
                                placeholder="Password (default: password123)"
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
                </div>
            </div>
        </AuthLayout>
    )
}

export default UserPortalLogin;