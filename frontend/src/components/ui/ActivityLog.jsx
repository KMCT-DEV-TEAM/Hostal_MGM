import React from 'react';
import { formatDateReadable } from '@/utils/formatters';

export default function ActivityLog({ timeline, defaultText = "No activity recorded yet." }) {
    return (
        <div className="space-y-3">
            {timeline && timeline.length > 0 ? (
                [...timeline].reverse().map((t, idx) => (
                    <div key={idx} className="border border-gray-100 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-medium text-gray-700 capitalize">{t.remarks || (t.action ? t.action.replace('_', ' ') : 'Action')}</span>
                            <span className="text-[10px] text-gray-400">{formatDateReadable(t.timestamp)}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 capitalize">by {t.actorRole || 'System'}</div>
                    </div>
                ))
            ) : (
                <div className="border border-gray-100 rounded-lg p-3 text-center text-xs text-gray-400">
                    {defaultText}
                </div>
            )}
        </div>
    );
}
