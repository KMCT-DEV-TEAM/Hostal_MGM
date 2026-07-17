import React from 'react';
import { Pencil } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';

const VisitorCard = ({ data, onEdit }) => {
    const visitorName = data?.visitorName || data?.name || 'Unknown';
    const relation = data?.relationship || data?.relation || '--';
    const initials = visitorName.charAt(0).toUpperCase();

    // Assigning colors based on first letter for variety (or fallback to blue)
    const getAvatarColor = (char) => {
        const colors = [
            'bg-blue-100 text-blue-700 border-blue-200',
            'bg-red-100 text-red-700 border-red-200',
            'bg-green-100 text-green-700 border-green-200',
            'bg-purple-100 text-purple-700 border-purple-200',
            'bg-orange-100 text-orange-700 border-orange-200'
        ];
        const index = char.charCodeAt(0) % colors.length;
        return colors[index];
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between active:scale-[0.99] transition-transform w-full">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 border ${getAvatarColor(initials)}`}>
                    {initials}
                </div>
                <div className="flex flex-col">
                    <h3 className="font-semibold text-text-primary text-sm">{visitorName}</h3>
                    <p className="text-xs text-text-secondary mt-0.5">Relationship: <span className="capitalize">{relation}</span></p>
                    
                    {/* Only show status badge on mobile if it's not pending to save space, or just always show it small */}
                    <div className="mt-1.5">
                        <StatusBadge status={data?.status} />
                    </div>
                </div>
            </div>
            
            {onEdit && (
                <button 
                    onClick={() => onEdit(data)}
                    className="p-2 text-primary hover:bg-blue-50 rounded-lg transition-colors shrink-0"
                >
                    <Pencil className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

export default VisitorCard;
