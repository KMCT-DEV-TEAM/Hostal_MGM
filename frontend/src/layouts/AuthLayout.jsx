const AuthLayout = ({
    leftPanel,
    children,
    rightSideClassName = "w-full lg:w-1/2 bg-background-secondary flex items-center justify-center p-6"
}) => {
    return (
        <div className="h-screen w-full flex font-sans bg-background overflow-hidden">
            {/* Left Side */}
            <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
                {/* Ambient Grid Pattern Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:80px_80px]" />

                {/* Decorative circles (solid opaque with double-bordered gap/halo) */}
                <div className="absolute top-[-80px] left-[-80px] w-56 h-56 rounded-full bg-[#164f85]" style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 0 0 32px #0A467F, 0 0 0 33px rgba(255,255,255,0.08)' }} />
                <div className="absolute top-10 right-[-60px] w-32 h-32 rounded-full bg-[#164f85]" style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 0 0 32px #0A467F, 0 0 0 33px rgba(255,255,255,0.08)' }} />
                <div className="absolute bottom-10 right-10 w-20 h-20 rounded-full bg-[#164f85] ring-[32px] ring-primary" />

                <div className="flex flex-col items-center justify-center w-full px-10 text-center text-white relative z-10">
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
