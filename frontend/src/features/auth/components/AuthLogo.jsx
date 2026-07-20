import React from 'react';
import logo from '@/assets/images/logo/logo.png';
import mobileLoginImage from '@/assets/images/auth/mobile-login.png';
import mobileLockImage from '@/assets/images/auth/mobile-lock.png';

const AuthLogo = ({ className = "h-16 lg:h-20 mb-6 lg:mb-8 mt-4 lg:mt-0 object-contain", isCentered = false, mobileImage = null }) => {
    
    let MobileImgSrc = null;
    if (mobileImage === 'login') MobileImgSrc = mobileLoginImage;
    if (mobileImage === 'lock') MobileImgSrc = mobileLockImage;

    if (isCentered) {
        return (
            <div className="flex justify-center lg:mb-8 mb-4">
                <img
                    src={logo}
                    alt="Logo"
                    className={`h-20 w-auto ${MobileImgSrc ? 'hidden md:block' : ''}`}
                />
                {MobileImgSrc && (
                    <img
                        src={MobileImgSrc}
                        alt="Mobile Logo"
                        className="h-56 w-auto object-contain md:hidden mx-auto drop-shadow-sm mb-2"
                    />
                )}
            </div>
        );
    }
    return (
        <>
            <img
                src={logo}
                alt="KMCT Logo"
                className={`${className} ${MobileImgSrc ? 'hidden md:block' : ''}`}
            />
            {MobileImgSrc && (
                <div className="flex justify-center w-full md:hidden mb-2">
                    <img
                        src={MobileImgSrc}
                        alt="KMCT Logo Mobile"
                        className="h-56 w-auto object-contain drop-shadow-sm"
                    />
                </div>
            )}
        </>
    );
};

export default AuthLogo;
