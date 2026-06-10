import logo from '@/assets/images/logo/logo.png';
import { Link } from 'react-router-dom';
import AuthLayout from './components/AuthLayout';
import AuthSidebarFeatures from './components/AuthSidebarFeatures';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const UserPortalLogin = () => {
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

                    <form className="space-y-5">
                        <Input
                            type="email"
                            label="Email"
                            placeholder="Enter Your Email"
                        />

                        <div>
                            <Input
                                type="password"
                                label="Password"
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