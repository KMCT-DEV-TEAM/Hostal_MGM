import React from 'react';

const AuthCard = ({ 
    title, 
    subtitle, 
    children, 
    variant = "step", // "step" | "login"
    className = "",
    titleClassName = "",
    subtitleClassName = ""
}) => {
    if (variant === "login") {
        return (
            <div className={`rounded-xl lg:shadow-sm lg:p-8 ${className}`}>
                {(title || subtitle) && (
                    <div className="text-center mb-4 lg:mb-8">
                        {title && (
                            <h2 className={`text-2xl lg:text-3xl font-bold text-primary ${titleClassName}`}>
                                {title}
                            </h2>
                        )}
                        {subtitle && (
                            <div className={`text-sm text-text-secondary mt-1.5 lg:mt-2 ${subtitleClassName}`}>
                                {subtitle}
                            </div>
                        )}
                    </div>
                )}
                {children}
            </div>
        );
    }

    // Default "step" variant
    return (
        <div className={`w-full bg-background lg:bg-white lg:rounded-xl lg:shadow-sm lg:px-10 lg:py-8 flex flex-col items-center ${className}`}>
            {title && (
                <h1 className={`text-xl lg:text-[32px] font-bold text-primary mb-2 lg:mb-3 text-center ${titleClassName}`}>
                    {title}
                </h1>
            )}
            {subtitle && (
                <div className={`text-gray-500 text-[13px] lg:text-sm text-center mb-5 lg:mb-8 max-w-sm leading-relaxed ${subtitleClassName}`}>
                    {subtitle}
                </div>
            )}
            {children}
        </div>
    );
};

export default AuthCard;
