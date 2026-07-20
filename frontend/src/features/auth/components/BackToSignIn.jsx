import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const BackToSignIn = ({ 
    to, 
    onClick, 
    className = "hidden md:flex items-center gap-2 text-primary hover:opacity-80 transition-opacity text-[13px] font-medium mt-6 lg:mt-10",
    iconSizeClassName = "w-4 h-4",
    strokeWidth = 2
}) => {
    const content = (
        <>
            <ArrowLeft className={iconSizeClassName} strokeWidth={strokeWidth} />
            Back to Sign in
        </>
    );

    if (to) {
        return (
            <Link to={to} className={className}>
                {content}
            </Link>
        );
    }

    return (
        <button onClick={onClick} className={className}>
            {content}
        </button>
    );
};

export default BackToSignIn;
