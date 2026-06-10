import { useNavigate } from 'react-router-dom';
import { Mail, Clock, ArrowLeft, Building2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { contactSchema } from '@/features/auth/validation/contactSchema';

const ContactAdministrator = () => {
    const navigate = useNavigate();
    
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(contactSchema),
        defaultValues: { issueType: '' }
    });

    const onSubmit = (data) => {
        console.log("Contact Administrator Data:", data);
        alert("Request submitted successfully!");
    };

    return (
        <div className="min-h-screen bg-background md:bg-background-secondary font-sans flex items-center justify-center p-0 md:p-4 md:py-12">
            <div className="bg-background max-w-[680px] w-full min-h-screen md:min-h-fit md:rounded-xl md:shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6 py-10 md:p-14 flex flex-col relative">

                {/* Mobile Back Button */}
                <button onClick={() => navigate('/admin/login')} className="md:hidden absolute top-8 left-6 text-gray-600 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="w-6 h-6" strokeWidth={1.5} />
                </button>

                {/* Header Section */}
                <div className="flex flex-col items-center text-center mt-8 md:mt-0">
                    {/* Logo Placeholder (using Lucide icon to mimic the building logo) */}
                    <div className="mb-6 flex flex-col items-center justify-center text-primary">
                        <Building2 className="w-12 h-12" strokeWidth={1.5} />
                        <span className="text-[10px] font-bold tracking-widest mt-1">KMCT</span>
                    </div>

                    <h1 className="text-2xl md:text-[34px] font-bold text-primary mb-3">
                        Contact Administrator
                    </h1>
                    <p className="text-text-secondary max-w-[420px] mx-auto text-[13px] md:text-sm leading-relaxed">
                        Need help accessing your account? Send a request and our administrator will get back to you.
                    </p>
                </div>

                <hr className="my-8 md:my-10 border-gray-100" />

                {/* Form Section */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Full Name"
                            type="text"
                            {...register('fullName')}
                            error={errors.fullName?.message}
                            placeholder="Enter your name"
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-colors text-text-primary text-sm"
                            labelClassName="block text-sm text-text-primary"
                            containerClassName="space-y-2"
                        />
                        <Input
                            label="Email"
                            type="email"
                            {...register('email')}
                            error={errors.email?.message}
                            placeholder="Enter your email"
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-colors text-text-primary text-sm"
                            labelClassName="block text-sm text-text-primary"
                            containerClassName="space-y-2"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm text-text-primary">Issue Type</label>
                        <div className="relative">
                            <select
                                {...register('issueType')}
                                className={`w-full px-4 py-3 rounded-lg border ${errors.issueType ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-secondary focus:ring-secondary/20'} focus:outline-none focus:ring-2 appearance-none bg-transparent ${!errors.issueType ? 'text-gray-500' : 'text-text-primary'} text-sm`}
                            >
                                <option value="" disabled>Select an issue type</option>
                                <option value="login">Login / Authentication</option>
                                <option value="access">Role / Permissions Access</option>
                                <option value="bug">System Bug</option>
                                <option value="other">Other</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                        {errors.issueType && <p className="text-red-500 text-xs mt-1.5">{errors.issueType.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm text-text-primary">Message</label>
                        <textarea
                            {...register('message')}
                            placeholder="Describe your issue in detail..."
                            rows={4}
                            className={`w-full px-4 py-3 rounded-lg border ${errors.message ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-secondary focus:ring-secondary/20'} placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-colors text-text-primary text-sm resize-none`}
                        ></textarea>
                        {errors.message && <p className="text-red-500 text-xs mt-1.5">{errors.message.message}</p>}
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-secondary text-white font-medium py-3.5 px-4 rounded-md transition-colors duration-200 text-sm mt-2"
                    >
                        Submit Request
                    </Button>
                </form>

                <hr className="md:hidden my-8 border-gray-100" />

                {/* Direct Support Section */}
                <div className="mt-2 md:mt-12 mb-12">
                    <h3 className="text-sm md:text-lg font-medium text-text-primary mb-6">Direct Support</h3>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-gray-50/50 rounded-lg border border-gray-200 flex items-center justify-center">
                                <Mail className="w-4 h-4 text-text-secondary" />
                            </div>
                            <div>
                                <p className="text-[11px] text-text-secondary mb-0.5">Administrator email</p>
                                <p className="text-sm text-text-primary">adminstrator@gmail.com</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-gray-50/50 rounded-lg border border-gray-200 flex items-center justify-center">
                                <Clock className="w-4 h-4 text-text-secondary" />
                            </div>
                            <div>
                                <p className="text-[11px] text-text-secondary mb-0.5">Support Hours</p>
                                <p className="text-sm text-text-primary">Mon - Sat, 9 AM - 5 PM</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col items-center space-y-3 mt-auto md:mt-0 pt-8 md:pt-0 pb-2 md:pb-0">
                    <button onClick={() => navigate('/admin/login')} className="hidden md:flex items-center gap-2 text-primary hover:opacity-80 transition-opacity text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Sign in
                    </button>
                    <p className="text-[11px] text-gray-400 md:text-text-secondary">Powered by kmct.org</p>
                </div>

            </div>
        </div>
    );
};

export default ContactAdministrator;