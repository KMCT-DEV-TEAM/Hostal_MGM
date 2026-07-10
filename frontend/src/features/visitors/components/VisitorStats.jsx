import React from 'react';
import { Users, UserCheck, Clock, Calendar } from 'lucide-react';
import StatsCard from '@/components/ui/StatsCard';

const iconMapping = {
    'total_visitors': {
        icon: Users,
        iconBg: 'bg-secondary/10 text-secondary',
        borderColor: 'border-t-2 border-t-secondary/70'
    },
    'pending': {
        icon: Clock,
        iconBg: 'bg-warning/10 text-warning',
        borderColor: 'border-t-2 border-t-warning/70'
    },
    'visitors_inside': {
        icon: UserCheck,
        iconBg: 'bg-success/10 text-success',
        borderColor: 'border-t-2 border-t-success/70'
    },
    'todays_visits': {
        icon: Calendar,
        iconBg: 'bg-primary/10 text-primary',
        borderColor: 'border-t-2 border-t-primary/70'
    }
};

const VisitorStats = ({ stats }) => {
    if (!stats || !Array.isArray(stats)) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {stats.map((stat) => {
                const config = iconMapping[stat.key] || {
                    icon: Users,
                    iconBg: 'bg-gray-100 text-gray-500',
                    borderColor: 'border-t-2 border-t-gray-300'
                };
                const Icon = config.icon;
                
                return (
                    <StatsCard
                        key={stat.key}
                        label={stat.title}
                        value={stat.value || 0}
                        icon={<Icon className="w-5 h-5" />}
                        iconBg={config.iconBg}
                        borderColor={config.borderColor}
                    />
                );
            })}
        </div>
    );
};

export default VisitorStats;
