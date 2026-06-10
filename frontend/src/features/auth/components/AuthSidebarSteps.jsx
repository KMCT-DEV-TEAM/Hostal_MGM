import lockImage from '@/assets/images/auth/lock.png';

const AuthSidebarSteps = ({ currentStep = 1 }) => {
    const steps = [
        {
            num: 1,
            title: "Enter your email",
            desc: "we'll send a 6-digit code to your admin email."
        },
        {
            num: 2,
            title: "Verify with OTP",
            desc: "Enter the code from your inbox. valid for 10 minutes."
        },
        {
            num: 3,
            title: "Set a new password",
            desc: "choose a strong password and you're back"
        }
    ];

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
                        {steps.map((step) => {
                            const isActiveOrCompleted = currentStep >= step.num;
                            return (
                                <div key={step.num} className={`flex gap-3 items-center ${isActiveOrCompleted ? 'opacity-100' : 'opacity-60'}`}>
                                    <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-semibold text-lg transition-colors ${
                                        isActiveOrCompleted ? 'border border-white/30' : 'border border-white/20 bg-white/10'
                                    }`}>
                                        {step.num}
                                    </div>
                                    <div className="pt-1 text-start">
                                        <h3 className="font-semibold text-base mb-1">{step.title}</h3>
                                        <p className="text-[13px] text-white/70 leading-relaxed">
                                            {step.desc}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
};

export default AuthSidebarSteps;
