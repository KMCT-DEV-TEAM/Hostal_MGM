import React from 'react';
import logo from '@/assets/images/logo/logo.png';

const AuthLogo = ({ className = "h-20 mb-10 mt-8 lg:mt-0 object-contain", isCentered = false }) => {
    if (isCentered) {
        return (
            <div className="flex justify-center lg:mb-8 mb-4">
                <img
                    src={logo}
                    alt="Logo"
                    className="h-20 w-auto"
                />
            </div>
        );
    }
    return (
        <img
            src={logo}
            alt="KMCT Logo"
            className={className}
        />
    );
};

export default AuthLogo;
