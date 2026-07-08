import React, { useState } from 'react';
import { Download, Filter } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import FilterModal from './modals/FilterModal';
import CheckInModal from './modals/CheckInModal';

const StatusBadge = ({ status }) => {
    const isInside = status.toLowerCase() === 'inside';
    const bgClass = isInside ? 'bg-success/10' : 'bg-primary/10';
    const textClass = isInside ? 'text-success' : 'text-primary';
    const borderClass = isInside ? 'border-success/30' : 'border-primary/30';

    return (
        <span className={`px-3 py-1.5 rounded-md text-xs border inline-flex items-center justify-center gap-1.5 min-w-[100px] ${bgClass} ${textClass} ${borderClass}`}>
            {status}
        </span>
    );
};

const VisitorDetailedView = ({ visitors, loading, onSearch, onFilter, onRefresh }) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isCheckInOpen, setIsCheckInOpen] = useState(false);

    const headers = [
        { key: 'date', label: 'Date' },
        { key: 'visitorName', label: 'Visitors Name' },
        { key: 'visitingStudent', label: 'Visiting Student' },
        { key: 'roomNo', label: 'Room NO' },
        { key: 'checkIn', label: 'Check In' },
        { key: 'checkOut', label: 'Check Out' },
        { key: 'status', label: 'Status' }
    ];

    const renderRow = (visitor) => (
        <>
            <td className="p-4 text-text-secondary font-medium">{visitor.date}</td>
            <td className="p-4 flex items-center gap-3
             text-gray-700">
                <div className="w-8 h-8 rounded-full bg-[#0A437A]/10 text-primary flex items-center justify-center font-bold text-xs uppercase shadow-sm shrink-0">
                    {visitor.visitorName.charAt(0)}
                </div>
                <span className="text-sm font-semibold">{visitor.visitorName}</span>
            </td>
            <td className="p-4 text-text-secondary font-medium">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs uppercase shadow-sm shrink-0">
                        {visitor.visitingStudent.charAt(0)}
                    </div>
                    <span className="text-sm font-medium">{visitor.visitingStudent}</span>
                </div>
            </td>
            <td className="p-4 text-text-secondary font-medium">{visitor.roomNo}</td>
            <td className="p-4 text-text-secondary font-medium">{visitor.checkIn}</td>
            <td className="p-4 text-text-secondary font-medium">{visitor.checkOut || '--------'}</td>
            <td className="p-4">
                <StatusBadge status={visitor.status} />
            </td>
        </>
    );

    const renderMobileItem = (visitor) => (
        <div className="flex flex-col gap-2 p-4">
            <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">{visitor.visitorName}</span>
                <StatusBadge status={visitor.status} />
            </div>
            <div className="text-sm text-gray-600">Visiting: {visitor.visitingStudent} ({visitor.roomNo})</div>
            <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500">In: {visitor.checkIn}</span>
                <span className="text-gray-500">Out: {visitor.checkOut || '---'}</span>
            </div>
        </div>
    );

    const toolbarActions = (
        <div className="flex items-center gap-2 relative">
            <Button
                variant="outline"
                size="sm"
                fullWidth={false}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
                <Filter className="w-4 h-4" /> Filter
            </Button>

            <FilterModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                onFilter={onFilter}
            />

            <Button variant="outline" size="sm" fullWidth={false} className="hidden sm:flex">
                <Download className="w-4 h-4" /> Export
            </Button>

            <Button size="sm" fullWidth={false} onClick={() => setIsCheckInOpen(true)}>
                Check In
            </Button>
        </div>
    );

    return (
        <div className="flex flex-col flex-1 h-full min-h-0 bg-white md:bg-transparent rounded-xl md:rounded-none relative">
            <DataTable
                headers={headers}
                items={visitors}
                loading={loading}
                emptyText="No visitors found"
                onSearchChange={(e) => onSearch(e.target.value)}
                toolbarActions={toolbarActions}
                renderRow={renderRow}
                renderMobileItem={renderMobileItem}
                page={1}
                setPage={() => { }}
                limit={10}
                totalItems={visitors?.length}
                totalPages={Math.max(1, Math.ceil(visitors?.length / 10))}
            />

            <CheckInModal
                isOpen={isCheckInOpen}
                onClose={() => setIsCheckInOpen(false)}
                onSuccess={onRefresh}
            />
        </div>
    );
};

export default VisitorDetailedView;
