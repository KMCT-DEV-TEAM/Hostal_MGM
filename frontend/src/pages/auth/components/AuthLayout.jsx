const AuthLayout = ({ 
    leftPanel, 
    children, 
    rightSideClassName = "w-full lg:w-1/2 bg-background-secondary flex items-center justify-center p-6" 
}) => {
    return (
        <div className="min-h-screen flex font-sans bg-background">
            {/* Left Side */}
            <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-[-80px] left-[-80px] w-56 h-56 rounded-full bg-background/5" />
                <div className="absolute top-10 right-[-60px] w-32 h-32 rounded-full bg-background/5" />
                <div className="absolute bottom-10 right-10 w-20 h-20 rounded-full bg-background/5" />

                <div className="flex flex-col items-center justify-center w-full px-10 text-center text-white">
                    {leftPanel}
                </div>
            </div>

            {/* Right Side */}
            <div className={rightSideClassName}>
                {children}
            </div>
        </div>
    );
};

export default AuthLayout;
