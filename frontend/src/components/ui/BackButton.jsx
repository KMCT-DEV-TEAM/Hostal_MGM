import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BackButton({ text = "Back", onClick, className = "" }) {
    const navigate = useNavigate();

    const handleClick = (e) => {
        if (onClick) {
            onClick(e);
        } else {
            navigate(-1);
        }
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`flex items-center text-sm text-text-secondary hover:text-primary cursor-pointer transition-colors ${className}`}
        >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {text}
        </button>
    );
}
