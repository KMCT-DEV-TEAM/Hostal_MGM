import lockImage from '@/assets/images/auth/lock.png';

const AuthSidebarSteps = () => {
    return (
        <>
            {/* Lock Illustration */}
            <img
                src={lockImage}
                alt="Lock"
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
        </>
    );
};

export default AuthSidebarSteps;
