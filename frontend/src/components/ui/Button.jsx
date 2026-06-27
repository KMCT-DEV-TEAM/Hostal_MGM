import { Loader2 } from 'lucide-react';

const Button = ({
    children,
    className = "w-full bg-primary hover:bg-secondary text-white font-semibold py-3 rounded-md transition",
    type = "button",
    isLoading = false,
    disabled = false,
    ...props
}) => {
    return (
        <button
            type={type}
            className={`${className} flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed`}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {children}
        </button>
    );
};

export default Button;
