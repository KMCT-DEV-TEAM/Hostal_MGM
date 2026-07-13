import React, { ReactNode, forwardRef } from "react";
import clsx from "clsx";


const colorStyles = {
  green: "bg-green-100 text-green-400",
  red: "bg-red-100 text-red-700",
  yellow: "bg-yellow-100 text-yellow-800",
  blue: "bg-blue-100 text-blue-700",
  gray: "bg-gray-100 text-gray-700",
  purple: "bg-purple-100 text-purple-700",
};

export const InfoCard = forwardRef(
  (
    {
      avatar,
      title,
      subtitle,
      status,
      editable,
      onEdit,
      onClick,
      fields = [],
      stats = [],
      actions,
      footer,
      className,
      isLoading,
      isEmpty,
      emptyMessage = "No data available",
    },
    ref
  ) => {
    const isImageUrl =
      typeof avatar === "string" &&
      (avatar.startsWith("http") ||
        avatar.startsWith("/") ||
        avatar.startsWith("data:"));

    const getInitials = (name) => {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return name.slice(0, 2).toUpperCase();
    };

    const handleEditClick = (e) => {
      e.stopPropagation();
      onEdit?.();
    };

    const handleKeyDown = (e) => {
      if (onClick && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        onClick();
      }
    };

    // --------------------------------------------------
    // Loading Skeleton State
    // --------------------------------------------------
    if (isLoading) {
      return (
        <div className={clsx("w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-6 lg:p-7 animate-pulse", className)}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
            <div className="w-16 h-6 rounded-full bg-gray-200 flex-shrink-0" />
          </div>
          <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                  <div className="h-4 bg-gray-200 rounded w-2/4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // --------------------------------------------------
    // Empty State
    // --------------------------------------------------
    if (isEmpty) {
      return (
        <div className={clsx("w-full bg-white rounded-3xl shadow-sm border border-dashed border-gray-300 p-8 flex flex-col items-center justify-center text-center", className)}>
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">{emptyMessage}</h3>
          {actions && <div className="mt-4">{actions}</div>}
        </div>
      );
    }

    // --------------------------------------------------
    // Normal State
    // --------------------------------------------------
    return (
      <div
        ref={ref}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        tabIndex={onClick ? 0 : undefined}
        role={onClick ? "button" : "article"}
        aria-label={title}
        className={clsx(
          "w-full bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden",
          "transition-all duration-300 ease-in-out group",
          onClick &&
          "cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-[0.99]",
          className
        )}
      >
        <div className="p-5 sm:p-6 lg:p-7">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {avatar && (
                <div className="flex-shrink-0">
                  {isImageUrl ? (
                    <img
                      src={avatar}
                      alt={title}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover bg-gray-100 border border-gray-200"
                      loading="lazy"
                    />
                  ) : typeof avatar === "string" ? (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg sm:text-xl border border-blue-100">
                      {getInitials(avatar)}
                    </div>
                  ) : (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden flex items-center justify-center bg-gray-50 border border-gray-100 text-gray-600">
                      {avatar}
                    </div>
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                    {title}
                  </h3>
                  {editable && (
                    <button
                      onClick={handleEditClick}
                      className={clsx(
                        "p-1.5 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500",
                        !onClick && "opacity-0 group-hover:opacity-100 focus:opacity-100" // hide edit icon until hover if not clickable entirely
                      )}
                      aria-label={`Edit ${title}`}
                      title="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      </svg>
                    </button>
                  )}
                </div>
                {subtitle && (
                  <p className="text-sm text-gray-500 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            {status && (
              <div
                className={clsx(
                  "flex-shrink-0 px-2.5 py-1 sm:px-3 sm:py-1 rounded-md text-xs sm:text-sm font-medium flex items-center gap-1.5 border border-transparent",
                  colorStyles[status.color || "gray"]
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                {status.text}
              </div>
            )}
          </div>

          {/* Fields */}
          {fields.length > 0 && (
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100">
              <div className="grid grid-cols-2 md:grid-cols-2 gap-y-4 gap-x-6">
                {fields.map((field, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {field.icon && (
                        <span className="text-gray-400 flex-shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5 sm:[&>svg]:w-4 sm:[&>svg]:h-4">
                          {field.icon}
                        </span>
                      )}
                      <span className="truncate">{field.label}</span>
                    </div>
                    <div className="text-sm text-gray-900 font-medium truncate">
                      {field.value || "-"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          {stats.length > 0 && (
            <div className="mt-5 sm:mt-6">
              <div
                className={clsx(
                  "pt-5 sm:pt-6 border-t border-gray-100 grid gap-4",
                  stats.length === 1 ? "grid-cols-1" :
                    stats.length === 2 ? "grid-cols-2" :
                      stats.length === 3 ? "grid-cols-3" :
                        "grid-cols-2 sm:grid-cols-4"
                )}
              >
                {stats.map((stat, idx) => (
                  <div key={idx} className="flex flex-col items-center justify-center text-center">
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">
                      {stat.value}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 mt-0.5 font-medium">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {actions && (
            <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-gray-100 flex flex-wrap items-center gap-3">
              {actions}
            </div>
          )}

          {/* Footer */}
          {footer && (
            <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-gray-100">
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  }
);

InfoCard.displayName = "InfoCard";
