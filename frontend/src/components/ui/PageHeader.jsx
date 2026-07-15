import React from 'react';

export default function PageHeader({ title, subtitle, actionButton, className = "" }) {
    return (
        <div className={`flex flex-col w-full ${className}`}>
            {actionButton && (
                <div className="mb-1 -ms-2">
                    {actionButton}
                </div>
            )}
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
        </div>
    );
}
