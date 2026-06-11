const Button = ({
    children,
    className = "w-full bg-primary hover:bg-secondary text-white font-semibold py-3 rounded-md transition",
    type = "button",
    ...props
}) => {
    return (
        <button
            type={type}
            className={className}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
