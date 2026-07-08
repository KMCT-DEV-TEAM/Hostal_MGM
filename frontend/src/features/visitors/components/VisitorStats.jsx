import React from 'react';
import { Users, UserCheck, UserX } from 'lucide-react'; // Placeholder icons, matching the UI
import StatsCard from '@/components/ui/StatsCard';

const VisitorStats = ({ stats }) => {
    if (!stats) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatsCard
                label="Total Visitors"
                value={stats.total}
                icon={<Users className="w-5 h-5" />}
                iconBg="bg-secondary/10 text-secondary"
                borderColor='border-t-2 border-t-secondary/70'
            />
            <StatsCard
                label="Inside"
                value={stats.inside}
                icon={<UserCheck className="w-5 h-5" />}
                iconBg="bg-success/10 text-success"
                borderColor='border-t-2 border-t-success/70'
            />
            <StatsCard
                label="Completed"
                value={stats.completed}
                icon={<UserX className="w-5 h-5" />}
                iconBg="bg-secondary/10 text-secondary/70"
                borderColor='border-t-2 border-t-secondary/70'
            />
        </div>
    );
};

export default VisitorStats;
