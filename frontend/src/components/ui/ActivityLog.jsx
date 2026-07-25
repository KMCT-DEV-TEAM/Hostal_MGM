import React from 'react';
import { formatDateReadable } from '@/utils/formatters';
import { UserCircle2 } from 'lucide-react';

export default function ActivityLog({ timeline, defaultText = "No activity recorded yet." }) {
    return (
        <div className="space-y-3">
            {timeline && timeline.length > 0 ? (
                [...timeline].reverse().map((t, idx) => {
                    const isClickable = typeof t.onClick === 'function';
                    return (
                        <div
                            key={idx}
                            onClick={isClickable ? t.onClick : undefined}
                            className={`border rounded-lg p-3 ${isClickable
                                    ? 'border-gray-200 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all active:scale-[0.99] bg-white'
                                    : 'border-gray-100 bg-white'
                                }`}
                        >
                            <div className="mb-2">
                                <span className="text-xs font-medium text-text-primary capitalize">{t.remarks || (t.action ? t.action.replace('_', ' ') : 'Action')}</span>
                            </div>
                            {(t.meta || t.actionButton) && (
                                <div className="flex items-center justify-between gap-3 mt-3 mb-3">
                                    {t.meta ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                {t.meta.icon || <UserCircle2 size={20} />}
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-text-secondary">{t.meta.label}</div>
                                                <div className="text-xs font-medium text-text-primary">{t.meta.value}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div />
                                    )}
                                    {t.actionButton && (
                                        <div className="shrink-0">
                                            {t.actionButton}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="flex justify-between items-center mt-3">
                                <div className="text-[10px] text-text-secondary capitalize">by {t.actorRole || 'System'}</div>
                                <span className="text-[10px] text-text-secondary">{formatDateReadable(t.timestamp)}</span>
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="border border-gray-100 rounded-lg p-3 text-center text-xs text-text-secondary">
                    {defaultText}
                </div>
            )}
        </div>
    );
}