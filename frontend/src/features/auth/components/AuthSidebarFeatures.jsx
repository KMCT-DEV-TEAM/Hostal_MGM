import hostelImage from '@/assets/images/auth/hostel.png';

const AuthSidebarFeatures = () => {
    return (
        <>
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
        </>
    );
};

export default AuthSidebarFeatures;
