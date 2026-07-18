import React, { useRef } from 'react';
import { Pencil, TimerIcon } from 'lucide-react';
import clsx from 'clsx';

/**
 * InfoCard - A generic, data-driven card component for responsive list views.
 */
export default function InfoCard({
    avatar,
    title,
    subtitle,
    fields = [],
    stats = [],
    status,
    meta = [],
    time,
    actions,
    footer,
    editable = false,
    onEdit,
    onClick,
    selected = false,
    canSelect = false,
    selectionMode = false,
    onSelect,
    className,
    statsGridClass,
    isLoading = false
}) {

    const timerRef = useRef(null);

    const handleTouchStart = () => {
        if (!canSelect) return;
        timerRef.current = setTimeout(() => {
            onSelect?.();
            if (navigator.vibrate) navigator.vibrate(50);
        }, 500);
    };

    const handleTouchEndOrMove = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    };

    // Safe color mapping for Tailwind
    const statusColorClasses = {
        green: 'bg-green-50 text-green-700',
        red: 'bg-red-50 text-red-700',
        yellow: 'bg-yellow-50 text-yellow-700',
        blue: 'bg-blue-50 text-blue-700',
        purple: 'bg-purple-50 text-purple-700',
        gray: 'bg-gray-100 text-gray-700',
    };

    const statusDotClasses = {
        green: 'bg-green-500',
        red: 'bg-red-500',
        yellow: 'bg-yellow-500',
        blue: 'bg-blue-500',
        purple: 'bg-purple-500',
        gray: 'bg-gray-500',
    };

    // Determine grid columns for stats
    const getStatsGridCols = (length) => {
        if (length === 1) return 'grid-cols-1';
        if (length === 2) return 'grid-cols-2';
        if (length === 3) return 'grid-cols-3';
        if (length === 4) return 'grid-cols-2 md:grid-cols-4';
        return 'grid-cols-2 md:grid-cols-3'; // fallback for 5+
    };

    const renderFooterContent = () => {
        if (footer) return footer;

        const hasMeta = meta && meta.length > 0;
        const hasRightActions = status || actions || onEdit || editable;

        if (!hasMeta && !hasRightActions && !time) return null;

        return (
            <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-100 flex-wrap">
                {/* LEFT: Meta Items & Time */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    {time && (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                            {time.icon ? <time.icon className="w-3.5 h-3.5 text-gray-400 shrink-0" /> : (
                                <TimerIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            )}
                            <span>{typeof time === 'string' ? time : (time.value || time.label)}</span>
                        </div>
                    )}
                    {meta.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                            <div key={idx} className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                                {Icon && <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                                <span>{item.value}</span>
                            </div>
                        );
                    })}
                </div>

                {/* RIGHT: Status & Actions */}
                <div className="flex flex-wrap items-center gap-2 ml-auto">
                    {status && (
                        <>
                            {(status.text || status.label) && (
                                <div className={clsx(
                                    'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md shrink-0 capitalize',
                                    status.bgClass && status.textClass ? `${status.bgClass} ${status.textClass} border border-current/20` : (statusColorClasses[status.color] || statusColorClasses.gray),
                                    status.className
                                )}>
                                    <div className={clsx(
                                        'w-1.5 h-1.5 rounded-full',
                                        status.dotClass ? status.dotClass : (statusDotClasses[status.color] || statusDotClasses.gray)
                                    )} />
                                    {status.text || status.label}
                                </div>
                            )}

                            {status.actions && (
                                <div className="flex items-center gap-2 shrink-0 ml-1" onClick={(e) => e.stopPropagation()}>
                                    {status.actions.map((btn, i) => (
                                        <button
                                            key={i}
                                            onClick={btn.onClick}
                                            className={clsx(
                                                'px-3 py-1.5 rounded-md text-xs font-bold border transition-colors shadow-sm',
                                                btn.color === 'green' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' :
                                                    btn.color === 'red' ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' :
                                                        btn.color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' :
                                                            'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                            )}
                                        >
                                            {btn.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {actions && (
                        <div className="flex items-center gap-2 shrink-0">
                            {actions}
                        </div>
                    )}

                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="relative bg-white rounded-xl border border-gray-100 p-4 shadow-sm animate-pulse">
                <div className="flex gap-4">
                    <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gray-200" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="mb-2">
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                            <div className="h-3 bg-gray-200 rounded w-1/3 mt-0.5" />
                        </div>
                        <div className="flex flex-col gap-2 mt-2">
                            <div className="h-3 bg-gray-200 rounded w-3/4" />
                            <div className="h-3 bg-gray-200 rounded w-5/6" />
                        </div>
                        <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-gray-50 flex-wrap">
                            <div className="flex items-center gap-2">
                                <div className="h-3 bg-gray-200 rounded w-16" />
                                <div className="h-3 bg-gray-200 rounded w-16" />
                            </div>
                            <div className="h-6 bg-gray-200 rounded w-20" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={(e) => {
                if (canSelect && (selected || selectionMode)) {
                    onSelect?.();
                } else if (onClick) {
                    onClick(e);
                }
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEndOrMove}
            onTouchMove={handleTouchEndOrMove}
            onContextMenu={(e) => {
                if (canSelect) {
                    e.preventDefault();
                }
            }}
            className={clsx(
                'relative bg-white rounded-xl border p-4 shadow-sm transition-all select-none',
                (onClick || canSelect) ? 'cursor-pointer hover:shadow-md hover:border-primary/30' : '',
                selected ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-gray-100',
                className
            )}
        >
            {(onEdit || editable) && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit?.();
                    }}
                    className="absolute top-4 right-4 p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                    <Pencil className="w-4 h-4" />
                </button>
            )}
            <div className="flex gap-4">
                {/* Left Column: Avatar */}
                {avatar && (
                    <div className="flex-shrink-0">
                        {typeof avatar === 'string' ? (
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm uppercase shadow-sm">
                                {avatar}
                            </div>
                        ) : (
                            avatar
                        )}
                    </div>
                )}

                {/* Right Column: Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">

                    {/* Header: Title & Subtitle */}
                    <div className="mb-2 pr-8">
                        {title && (
                            <h3 className="text-base font-bold text-gray-900 truncate leading-tight">
                                {title === '-' || !title ? 'N/A' : title}
                            </h3>
                        )}
                        {subtitle && (
                            <p className="text-sm font-medium text-gray-500 truncate mt-0.5">
                                {subtitle === '-' || !subtitle ? 'N/A' : subtitle}
                            </p>
                        )}
                    </div>

                    {/* Middle: Icon Fields */}
                    {fields && fields.length > 0 && (
                        <div className="flex flex-col gap-1.5 mt-1">
                            {fields.map((field, idx) => {
                                const Icon = field.icon;
                                return (
                                    <div key={idx} className="flex items-start text-sm text-gray-600 py-0.5">
                                        {field.label ? (
                                            <>
                                                <div className="flex items-center gap-2 w-28 shrink-0 text-gray-500 font-medium">
                                                    {Icon && <Icon className="w-4 h-4 shrink-0 text-gray-400" />}
                                                    <span className="truncate">{field.label}</span>
                                                </div>
                                                <span className="text-gray-400 shrink-0 px-1.5 font-semibold">:</span>
                                                <span className="flex-1 min-w-0 text-gray-800 font-medium truncate">
                                                    {field.value === 0 ? 0 : (field.value === '-' || !field.value ? 'N/A' : field.value)}
                                                </span>
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-2 truncate">
                                                {Icon && <Icon className="w-4 h-4 shrink-0 text-gray-400" />}
                                                <span className="truncate font-medium text-gray-800">{field.value === 0 ? 0 : (field.value === '-' || !field.value ? 'N/A' : field.value)}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                </div>
            </div>

            {/* Stats Grid (Full Width) */}
            {stats && stats.length > 0 && (
                <div className={clsx('grid gap-2 mt-3 pt-3 border-t border-gray-50', statsGridClass || getStatsGridCols(stats.length))}>
                    {stats.map((stat, idx) => (
                        <div key={idx} className={clsx("flex flex-col text-center bg-gray-50/50 rounded-lg py-1.5 border border-gray-100", stat.className)}>
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{stat.label}</span>
                            <span className="text-sm font-bold text-gray-900 mt-0.5">{stat.value}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Footer across full width of card */}
            {renderFooterContent()}
        </div>
    );
}
