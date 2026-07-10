import { Loader2 } from "lucide-react";

const variants = {
    primary: "bg-primary text-white hover:bg-secondary",
    outline: "bg-white border border-gray-200 text-text-secondary hover:bg-gray-50",
    ghost: "bg-transparent hover:bg-gray-100 text-text-secondary",
    danger: "bg-red-400 text-white hover:bg-red-600",
};

const sizes = {
    sm: "px-4 py-2 text-sm rounded-md",
    md: "px-5 py-2.5 text-sm rounded-md",
    lg: "px-6 py-3 text-base rounded-md",
    icon: "p-3 rounded-xl",
};

const Button = ({
    children,
    variant = "primary",
    size = "lg",
    fullWidth = true,
    className = "",
    type = "button",
    isLoading = false,
    disabled = false,
    ...props
}) => {
    return (
        <button
            type={type}
            disabled={isLoading || disabled}
            className={`
                inline-flex items-center justify-center gap-2
                transition cursor-pointer
                shadow-sm md:shadow-none
                whitespace-nowrap
                disabled:opacity-70 disabled:cursor-not-allowed
                ${variants[variant]}
                ${sizes[size]}
                ${fullWidth ? "w-full" : ""}
                ${className}
            `}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {children}
        </button>
    );
};

export default Button;