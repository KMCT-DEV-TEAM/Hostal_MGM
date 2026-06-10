import React from 'react';
import { ArrowLeft } from 'lucide-react';
import logo from '@/assets/images/logo/logo.png';
import lockImage from '@/assets/images/auth/lock.png';

const ForgotPassword = () => {
    return (
        <div className="min-h-screen flex font-sans bg-background">
            {/* Left Side */}
            <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-[-80px] left-[-80px] w-56 h-56 rounded-full bg-background/5" />
                <div className="absolute top-10 right-[-60px] w-32 h-32 rounded-full bg-background/5" />
                <div className="absolute bottom-10 right-10 w-20 h-20 rounded-full bg-background/5" />

                <div className="flex flex-col items-center justify-center w-full px-10 text-center text-white">
                    {/* Hostel Illustration */}
                    <img
                        src={lockImage}
                        alt="Hostel"
                        className="h-[250px] mb-10 opacity-70"
                    />

                    <div className="max-w-lg w-full relative z-10 text-white">
                        <h2 className="text-2xl font-bold mb-10 leading-tight">
                            Forgot Password? Reset in 3 simple steps
                        </h2>

                        <div className='flex justify-center'>
                            <div className="flex flex-col gap-4 max-w-sm">
                                {/* Step 1 */}
                                <div className="flex gap-3 items-center w-fit">
                                    <div className="w-10 h-10 shrink-0 rounded-full border border-white/30 flex items-center justify-center font-semibold text-lg">
                                        1
                                    </div>
                                    <div className="pt-1 text-start">
                                        <h3 className="font-semibold text-base mb-1">Enter your email</h3>
                                        <p className="text-[13px] text-white/70 leading-relaxed">
                                            we'll send a 6-digit code to your admin email.
                                        </p>
                                    </div>
                                </div>

                                {/* Step 2 */}
                                <div className="flex gap-3 items-center">
                                    <div className="w-10 h-10 shrink-0 rounded-full border border-white/20 bg-white/10 flex items-center justify-center font-semibold text-lg">
                                        2
                                    </div>
                                    <div className="pt-1 text-start">
                                        <h3 className="font-semibold text-base mb-1">Verify with OTP</h3>
                                        <p className="text-[13px] text-white/70 leading-relaxed">
                                            Enter the code from your inbox. valid for 10 minutes.
                                        </p>
                                    </div>
                                </div>

                                {/* Step 3 */}
                                <div className="flex gap-3 items-center">
                                    <div className="w-10 h-10 shrink-0 rounded-full border border-white/20 bg-white/10 flex items-center justify-center font-semibold text-lg">
                                        3
                                    </div>
                                    <div className="pt-1 text-start">
                                        <h3 className="font-semibold text-base mb-1">Set a new password</h3>
                                        <p className="text-[13px] text-white/70 leading-relaxed">
                                            choose a strong password and you're back
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side */}
            <div className="w-full  lg:w-1/2 flex flex-col relative min-h-screen lg:min-h-0">
                <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8 min-h-full">

                    <div className="w-full max-w-[480px] flex flex-col items-center">

                        {/* Logo */}
                        <img
                            src={logo}
                            alt="KMCT Logo"
                            className="h-20 mb-10 mt-8 lg:mt-0 object-contain"
                        />

                        {/* Stepper */}
                        <div className="flex items-start justify-between w-full max-w-xs mb-5 relative">
                            {/* Connecting Line Background */}
                            <div className="absolute top-[17px] left-6 right-6 h-px bg-gray-300 z-0"></div>

                            <div className="flex flex-col items-center gap-2 relative z-10 px-1">
                                <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-[13px] font-medium">
                                    1
                                </div>
                                <span className="text-[12px] text-text-primary">Email</span>
                            </div>

                            <div className="flex flex-col items-center gap-2 relative z-10 px-1">
                                <div className="w-9 h-9 rounded-full border border-primary text-primary bg-white flex items-center justify-center text-[13px] font-medium">
                                    2
                                </div>
                                <span className="text-[12px] text-text-primary">Verify</span>
                            </div>

                            <div className="flex flex-col items-center gap-2 relative z-10 px-1">
                                <div className="w-9 h-9 rounded-full border border-primary text-primary bg-white flex items-center justify-center text-[13px] font-medium">
                                    3
                                </div>
                                <span className="text-[12px] text-text-primary">Reset</span>
                            </div>
                        </div>

                        {/* Form Card */}
                        <div className="w-full bg-background lg:bg-white lg:rounded-xl lg:shadow-[0_2px_15px_rgba(0,0,0,0.03)] lg:px-12 lg:py-14 flex flex-col items-center">

                            <h1 className="text-2xl lg:text-[32px] font-bold text-primary mb-3 text-center">
                                Forgot Password?
                            </h1>
                            <p className="text-gray-500 text-[13px] lg:text-sm text-center mb-8 max-w-[280px] leading-relaxed">
                                Enter your email and we'll send you a verification code
                            </p>

                            <form className="w-full space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-[13px] font-medium text-text-primary">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="Enter Your Email"
                                        className="w-full px-4 py-3.5 rounded-lg border border-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-colors text-sm"
                                    />
                                </div>

                                <button
                                    type="button"
                                    className="w-full bg-secondary hover:bg-primary text-white font-medium py-3.5 rounded-lg transition-colors duration-200 text-sm mt-2"
                                >
                                    Send verification code
                                </button>
                            </form>

                            {/* Back to sign in - Desktop Only */}
                            <button className="hidden lg:flex items-center gap-2 text-primary hover:opacity-80 transition-opacity text-[13px] font-medium mt-10">
                                <ArrowLeft className="w-4 h-4" strokeWidth={2} />
                                Back to Sign in
                            </button>
                        </div>

                    </div>

                    {/* Footer text */}
                    <div className="mt-auto pt-10 pb-2">
                        <p className="text-[11px] text-gray-400">Powered by kmct.org</p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;