import React from 'react';

export default function PageHeader({ title, subtitle }) {
    return (
        <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle && <p className="text-xs text-text-secondary mt-1">{subtitle}</p>}
        </div>
    );
}
