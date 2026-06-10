import React from 'react';
import { Check } from 'lucide-react';

const AuthStepper = ({ currentStep = 1 }) => {
    const steps = [
        { num: 1, label: 'Email' },
        { num: 2, label: 'Verify' },
        { num: 3, label: 'Reset' }
    ];

    return (
        <div className="flex items-start justify-between w-full max-w-xs mb-5 relative">
            {/* Connecting Line Background */}
            <div className="absolute top-[17px] left-6 right-6 h-px bg-gray-300 z-0">
                <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
                ></div>
            </div>

            {steps.map((step) => {
                const isCompleted = currentStep > step.num;
                const isActive = currentStep === step.num;

                return (
                    <div key={step.num} className="flex flex-col items-center gap-2 relative z-10 px-1">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-medium transition-colors ${
                            isActive ? 'bg-primary text-white' : 'border border-primary text-primary bg-white'
                        }`}>
                            {isCompleted ? <Check className="w-4 h-4" strokeWidth={3} /> : step.num}
                        </div>
                        <span className="text-[12px] text-text-primary">{step.label}</span>
                    </div>
                );
            })}
        </div>
    );
};

export default AuthStepper;
