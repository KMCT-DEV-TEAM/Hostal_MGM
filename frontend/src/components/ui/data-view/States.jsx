import React from 'react';
import { Loader2, AlertCircle, FileX } from 'lucide-react';

export function LoadingState({ message = 'Loading data...', fullHeight = false }) {
    return (
        <div className={`flex flex-col items-center justify-center p-8 text-gray-500 bg-white/50 ${fullHeight ? 'min-h-[400px]' : 'min-h-[200px]'}`}>
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-sm font-medium animate-pulse">{message}</p>
        </div>
    );
}

export function ErrorState({ error, message = 'Failed to load data', onRetry, fullHeight = false }) {
    return (
        <div className={`flex flex-col items-center justify-center p-8 text-center bg-red-50/30 ${fullHeight ? 'min-h-[400px]' : 'min-h-[200px]'}`}>
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 shadow-sm">
                <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-medium text-red-800 mb-1">{message}</h3>
            {error && (
                <p className="text-xs text-red-600 max-w-md mx-auto opacity-80 mb-4">
                    {typeof error === 'string' ? error : error?.message || 'An unexpected error occurred'}
                </p>
            )}
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="px-4 py-2 bg-white border border-red-200 text-red-700 text-sm font-medium rounded-lg shadow-sm hover:bg-red-50 transition-colors"
                >
                    Try Again
                </button>
            )}
        </div>
    );
}

export function EmptyState({ title = 'No data available', description = 'There are no records to display.', fullHeight = false }) {
    return (
        <div className={`flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 ${fullHeight ? 'min-h-[400px]' : 'min-h-[200px]'}`}>
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mb-4">
                <FileX className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
                {description}
            </p>
        </div>
    );
}
