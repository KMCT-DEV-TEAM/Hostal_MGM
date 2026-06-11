import React from 'react';

const AuthFooter = ({ className = "mt-auto pt-5 pb-2" }) => {
    return (
        <div className={className}>
            <p className="text-[11px] text-gray-400">Powered by kmct.org</p>
        </div>
    );
};

export default AuthFooter;
