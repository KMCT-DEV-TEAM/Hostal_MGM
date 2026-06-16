import { Link } from 'react-router-dom';

const Forbidden = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
            <h1 className="text-6xl font-bold text-primary mb-4">403</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">Access Denied</h2>
            <p className="text-gray-500 mb-8 text-center max-w-md">
                You do not have permission to view this page. If you believe this is a mistake, please contact your administrator.
            </p>
            <Link
                to="/dashboard"
                className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
                Return to Dashboard
            </Link>
        </div>
    );
};

export default Forbidden;
