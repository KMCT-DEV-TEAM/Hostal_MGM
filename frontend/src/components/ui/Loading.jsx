import { Loader2 } from 'lucide-react';

const Loading = () => {
    return (
        <div className="flex items-center justify-center min-h-[50vh] w-full">
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-gray-500 font-medium">Loading...</p>
            </div>
        </div>
    );
};

export default Loading;
