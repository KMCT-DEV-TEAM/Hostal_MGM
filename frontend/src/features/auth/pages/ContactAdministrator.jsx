import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthLayout from '@/layouts/AuthLayout';
import AuthSidebarFeatures from '@/features/auth/components/AuthSidebarFeatures';
import AuthLogo from '@/features/auth/components/AuthLogo';
import AuthCard from '@/features/auth/components/AuthCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { passwordRequestApi } from '@/features/dashboard/api/passwordRequestApi';
import { showSuccessToast, showErrorToast } from '@/utils/toast';

const verifyEmailSchema = z.object({
    email: z.string().email("Please enter a valid email address")
});

const resetPasswordSchema = z.object({
    newPassword: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

const ContactAdministrator = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [verifiedEmail, setVerifiedEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { register: registerEmail, handleSubmit: handleEmailSubmit, formState: { errors: emailErrors } } = useForm({
        resolver: zodResolver(verifyEmailSchema)
    });

    const { register: registerPassword, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors } } = useForm({
        resolver: zodResolver(resetPasswordSchema)
    });

    const onVerifyEmail = async (data) => {
        setIsLoading(true);
        try {
            await passwordRequestApi.verifyEmail({ email: data.email });
            setVerifiedEmail(data.email);
            setStep(2);
            showSuccessToast('Email Verified', 'You can now reset your password.');
        } catch (error) {
            showErrorToast('Verification Failed', error?.message || 'Email not found in our records.');
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmitPassword = async (data) => {
        setIsLoading(true);
        try {
            await passwordRequestApi.submitPasswordRequest({
                email: verifiedEmail,
                newPassword: data.newPassword,
                confirmPassword: data.confirmPassword
            });
            showSuccessToast('Request Submitted', 'Your password reset request has been sent to the administrator.');
            navigate('/admin/login');
        } catch (error) {
            showErrorToast('Submission Failed', error?.message || 'Failed to submit password request.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout leftPanel={<AuthSidebarFeatures />}>
            <div className="w-full max-w-md">
                <AuthLogo isCentered={true} />

                <AuthCard
                    variant="login"
                    title="Reset Password"
                    subtitle="Need help accessing your account? Send a request."
                >
                    {isLoading ? (
                        <div className="space-y-6 animate-pulse">
                            {step === 1 ? (
                                <div>
                                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                    <div className="h-11 bg-gray-100 rounded-lg w-full"></div>
                                </div>
                            ) : (
                                <>
                                    <div className="h-12 bg-gray-100 rounded-lg w-full mb-4"></div>
                                    <div>
                                        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                        <div className="h-11 bg-gray-100 rounded-lg w-full"></div>
                                    </div>
                                    <div>
                                        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                                        <div className="h-11 bg-gray-100 rounded-lg w-full"></div>
                                    </div>
                                </>
                            )}
                            <div className="h-12 bg-[#0A437A]/50 rounded-md w-full flex items-center justify-center mt-2">
                                <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                            </div>
                        </div>
                    ) : step === 1 ? (
                        <form onSubmit={handleEmailSubmit(onVerifyEmail)} className="space-y-6">
                            <Input
                                label="Email Address"
                                type="email"
                                {...registerEmail('email')}
                                error={emailErrors.email?.message}
                                placeholder="Enter your registered email"
                            />

                            <Button type="submit" isLoading={isLoading}>
                                <div className="flex items-center justify-center gap-2">
                                    <span>{isLoading ? 'Verifying...' : 'Verify Email'}</span>
                                </div>
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handlePasswordSubmit(onSubmitPassword)} className="space-y-6">
                            <div className="text-sm text-text-secondary bg-gray-50 p-3 rounded-lg">
                                Verified Email: <span className="font-medium text-text-primary">{verifiedEmail}</span>
                            </div>

                            <Input
                                label="New Password"
                                type="password"
                                {...registerPassword('newPassword')}
                                onCopy={(e) => e.preventDefault()}
                                onPaste={(e) => e.preventDefault()}
                                onCut={(e) => e.preventDefault()}
                                error={passwordErrors.newPassword?.message}
                                placeholder="Enter new password"
                            />

                            <Input
                                label="Confirm Password"
                                type="password"
                                {...registerPassword('confirmPassword')}
                                onCopy={(e) => e.preventDefault()}
                                onPaste={(e) => e.preventDefault()}
                                onCut={(e) => e.preventDefault()}
                                error={passwordErrors.confirmPassword?.message}
                                placeholder="Confirm new password"
                            />

                            <Button type="submit" isLoading={isLoading}>
                                <div className="flex items-center justify-center gap-2">
                                    <span>{isLoading ? 'Sending...' : 'Send Password Request'}</span>
                                </div>
                            </Button>
                        </form>
                    )}

                    <p className="text-center text-xs text-text-secondary mt-6">
                        Remember your password ?
                        <button 
                            onClick={() => navigate('/admin/login')} 
                            className="ml-1 text-accent font-medium hover:text-accent/80 transition-colors cursor-pointer"
                        >
                            Back to Sign In
                        </button>
                    </p>
                </AuthCard>
            </div>
        </AuthLayout>
    );
};

export default ContactAdministrator;
