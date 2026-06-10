const Input = ({ 
    label, 
    className = "w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary", 
    containerClassName = "", 
    labelClassName = "block mb-2 text-sm text-text-primary font-medium", 
    ...props 
}) => {
    return (
        <div className={containerClassName}>
            {label && (
                <label className={labelClassName}>
                    {label}
                </label>
            )}
            <input
                className={className}
                {...props}
            />
        </div>
    );
};

export default Input;
