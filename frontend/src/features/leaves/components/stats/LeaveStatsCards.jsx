import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import StatsCard from '@/components/ui/StatsCard';

export default function LeaveStatsCards({ stats, isAdmin = false, isStudent = false }) {
    return (
        <div className={`grid grid-cols-1 sm:grid-cols-3 ${isAdmin ? 'lg:grid-cols-4' : ''} gap-6 mb-8 shrink-0`}>
            {/* Super Admin gets a Total Requests card, others do too except maybe if custom layout */}
            <StatsCard
                label="TOTAL REQUESTS"
                value={stats.total || 0}
                icon={<CalendarIcon className="w-4 h-4 text-primary" />}
                iconBg="bg-primary/10"
                borderColor="border-t-2 border-t-primary"
            />

            <StatsCard
                label="APPROVED REQUESTS"
                value={stats.approved || 0}
                icon={<CalendarIcon className="w-4 h-4 text-success" />}
                iconBg="bg-success/10"
                borderColor="border-t-2 border-t-success"
            />

            <StatsCard
                label="PENDING REQUESTS"
                value={stats.pending || 0}
                icon={<CalendarIcon className="w-4 h-4 text-warning" />}
                iconBg="bg-warning/10"
                borderColor="border-t-2 border-t-warning"
            />

            {/* Admin or SuperAdmin typically show Rejected, Student/Parent do not always, but we can render if stats.rejected is defined */}
            {stats.rejected !== undefined && (
                <StatsCard
                    label="REJECTED REQUESTS"
                    value={stats.rejected || 0}
                    icon={<CalendarIcon className="w-4 h-4 text-danger" />}
                    iconBg="bg-danger/10"
                    borderColor="border-t-2 border-t-danger"
                />
            )}
        </div>
    );
}
