import React, { ReactNode, forwardRef } from "react";
import clsx from "clsx";
import { Pencil } from "lucide-react";

const colorStyles = {
  green: "bg-[#F0FAF5] text-[#22C55E]",
  red: "bg-red-50 text-red-600",
  yellow: "bg-yellow-50 text-yellow-600",
  blue: "bg-blue-50 text-blue-600",
  gray: "bg-gray-50 text-gray-600",
  purple: "bg-purple-50 text-purple-600",
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
        <div className={clsx("w-full bg-white rounded-[24px] shadow-sm border border-gray-50 p-5 sm:p-6 lg:p-7 animate-pulse", className)}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-[52px] h-[52px] rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
            <div className="w-16 h-6 rounded-full bg-gray-200 flex-shrink-0" />
          </div>
          <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-gray-50">
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
        <div className={clsx("w-full bg-white rounded-[24px] shadow-sm border border-dashed border-gray-300 p-4 flex flex-col items-center justify-center text-center", className)}>
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
          "w-full bg-white rounded-[28px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100/50 overflow-hidden",
          "transition-all duration-300 ease-in-out group",
          onClick &&
          "cursor-pointer hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-[0.99]",
          className
        )}
      >
        <div className="px-4 py-4 sm:px-7 sm:py-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              {avatar && (
                <div className="flex-shrink-0">
                  {isImageUrl ? (
                    <img
                      src={avatar}
                      alt={title}
                      className="w-[42px] h-[42px] rounded-full object-cover bg-gray-100 border border-gray-100"
                      loading="lazy"
                    />
                  ) : typeof avatar === "string" ? (
                    <div className="w-[42px] h-[42px] rounded-full bg-[#D6E4F0] text-[#0A437A] flex items-center justify-center font-medium text-[17px]">
                      {getInitials(avatar)}
                    </div>
                  ) : (
                    <div className="w-[42px] h-[42px] rounded-full overflow-hidden flex items-center justify-center bg-gray-50 border border-gray-100 text-gray-600">
                      {avatar}
                    </div>
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-[14px] font-medium text-gray-900 truncate">
                    {title}
                  </h3>
                  {editable && (
                    <button
                      onClick={handleEditClick}
                      className={clsx(
                        "p-1.5 -ml-1 rounded-full text-blue-500 hover:bg-blue-50 transition-colors",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500",
                        !onClick && "opacity-0 group-hover:opacity-100 focus:opacity-100"
                      )}
                      aria-label={`Edit ${title}`}
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {subtitle && (
                  <p className="text-[13px] text-gray-400 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            {status && (
              <div
                className={clsx(
                  "flex-shrink-0 px-3 py-1 rounded-lg text-[13px] font-medium flex items-center gap-1.5",
                  colorStyles[status.color || "gray"]
                )}
              >
                <span className="w-[5px] h-[5px] rounded-full bg-current opacity-90" />
                {status.text}
              </div>
            )}
          </div>

          {/* Fields */}
          {fields.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-50">
              <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                {fields.map((field, idx) => (
                  <div key={idx} className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-[13px] text-gray-400 font-medium">
                      {field.icon && (
                        <span className="text-gray-400 flex-shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5">
                          {field.icon}
                        </span>
                      )}
                      <span className="truncate">{field.label}</span>
                    </div>
                    <div className="text-[15px] text-gray-800 font-medium truncate">
                      {field.value ? field.value.charAt(0).toUpperCase() + field.value.slice(1) : "-"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          {stats.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-50">
              <div
                className={clsx(
                  "grid gap-4",
                  stats.length === 1 ? "grid-cols-1" :
                    stats.length === 2 ? "grid-cols-2" :
                      stats.length === 3 ? "grid-cols-3" :
                        "grid-cols-2 sm:grid-cols-4"
                )}
              >
                {stats.map((stat, idx) => (
                  <div key={idx} className="flex flex-col items-center justify-center text-center gap-0.5">
                    <div className="text-[19px] font-medium text-gray-900">
                      {stat.value}
                    </div>
                    <div className="text-[13px] text-gray-400">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {actions && (
            <div className="mt-6 pt-5 border-t border-gray-50 flex flex-wrap items-center gap-3">
              {actions}
            </div>
          )}

          {/* Footer */}
          {footer && (
            <div className="mt-6 pt-5 border-t border-gray-50">
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  }
);

InfoCard.displayName = "InfoCard";
