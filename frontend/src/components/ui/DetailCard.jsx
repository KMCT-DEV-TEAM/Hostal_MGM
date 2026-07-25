import React from 'react';

export default function DetailCard({ title, subtitle, children, headerAction, className = '' }) {
    return (
        <div className={`border border-gray-100 rounded-xl p-5 bg-white shadow-sm ${className}`}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-0 mb-6">
                <div>
                    {title && <h3 className="text-primary font-semibold text-sm mb-1">{title}</h3>}
                    {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
                </div>
                {headerAction && (
                    <div>{headerAction}</div>
                )}
            </div>
            {children}
        </div>
    );
}
