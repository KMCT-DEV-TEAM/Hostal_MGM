
import logo from '@/assets/images/logo/logo.png';
import hostelImage from '@/assets/images/auth/hostel.png';

const SuperAdminLogin = () => {
    return (
        <div className="min-h-screen flex font-sans bg-background">
            {/* Left Side */}
            <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-[-80px] left-[-80px] w-56 h-56 rounded-full bg-background/5" />
                <div className="absolute top-10 right-[-60px] w-32 h-32 rounded-full bg-background/5" />
                <div className="absolute bottom-10 right-10 w-20 h-20 rounded-full bg-background/5" />

                <div className="flex flex-col items-center justify-center w-full px-10 text-center text-white">
                    {/* Hostel Illustration */}
                    <img
                        src={hostelImage}
                        alt="Hostel"
                        className="h-[350px] mb-10 opacity-70"
                    />

                    <h1 className="text-4xl font-bold mb-3">
                        Manage Your Hostel From One Place
                    </h1>

                    <p className="text-lg mb-10 max-w-lg">
                        Track students, rooms, attendance and complaints in real time.
                    </p>

                    <div className="flex gap-4">
                        <div className="bg-background/10 backdrop-blur-sm rounded-lg px-6 py-4">
                            <div className="text-xl font-bold">300+</div>
                            <div className="text-xs">Students</div>
                        </div>

                        <div className="bg-background/10 backdrop-blur-sm rounded-lg px-6 py-4">
                            <div className="text-xl font-bold">500</div>
                            <div className="text-xs">Rooms</div>
                        </div>

                        <div className="bg-background/10 backdrop-blur-sm rounded-lg px-6 py-4">
                            <div className="text-xl font-bold">99%</div>
                            <div className="text-xs">Occupancy</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side */}
            <div className="w-full lg:w-1/2 bg-background-secondary flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="flex justify-center lg:mb-8 mb-4">
                        <img
                            src={logo}
                            alt="Logo"
                            className="h-20 w-auto"
                        />
                    </div>

                    {/* Login Card */}
                    <div className=" rounded-xl lg:shadow-sm lg:p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-primary">
                                Sign In
                            </h2>

                            <p className="text-text-secondary mt-2">
                                Access your admin dashboard
                            </p>
                        </div>

                        <form className="space-y-5">
                            <div>
                                <label className="block mb-2 text-sm text-text-primary font-medium">
                                    Email
                                </label>

                                <input
                                    type="email"
                                    placeholder="Enter Your Email"
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block mb-2 text-sm text-text-primary font-medium">
                                    Password
                                </label>

                                <input
                                    type="password"
                                    placeholder="Password (default: password123)"
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-primary hover:opacity-90 text-white font-semibold py-3 rounded-md transition"
                            >
                                Sign In
                            </button>
                        </form>
                    </div>

                    <p className="text-center text-xs text-text-secondary mt-6">
                        Powered by Hostel ERP
                    </p>
                </div>
            </div>
        </div>
    )
}

export default SuperAdminLogin;