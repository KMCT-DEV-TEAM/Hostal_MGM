const Input = ({ 
    label, 
    className = "w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary", 
    containerClassName = "", 
    labelClassName = "block mb-2 text-sm text-text-primary font-medium", 
    endIcon,
    ...props 
}) => {
    return (
        <div className={containerClassName}>
            {label && (
                <label className={labelClassName}>
                    {label}
                </label>
            )}
            <div className="relative w-full">
                <input
                    className={`${className} ${endIcon ? 'pr-10' : ''}`}
                    {...props}
                />
                {endIcon && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 flex items-center">
                        {endIcon}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Input;
