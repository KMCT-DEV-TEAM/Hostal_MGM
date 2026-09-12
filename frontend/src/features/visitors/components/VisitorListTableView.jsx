import React from 'react';
import DataView from '@/components/ui/data-view/DataView';
import { Edit, Phone, Building, Users, Download, Plus, DoorOpen, Handshake, Clock } from 'lucide-react';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import Dropdown from '@/components/ui/Dropdown';
import { ROLES } from '@/constants/roles';
import AssignedStudentsDisplay from '@/components/AssignedStudentsDisplay';

const VisitorListTableView = ({
    visitors,
    loading,
    searchQuery,
    onSearch,
    statusFilter,
    onStatusFilterChange,
    canExport,
    onExportClick,
    canRegister = false,
    onRegisterClick,
    onRowClick,
    page,
    setPage,
    pagination,
    userRole,
    onEdit,
    limit,
    setLimit
}) => {

    const columns = [
        {
            key: 'visitor',
            header: 'Visitor Name',
            type: 'user',
            titleAccessor: (visitor) => visitor.visitorName || visitor.name || 'Unknown',
            avatarAccessor: (visitor) => visitor.visitorName || visitor.name || 'Unknown'
        },
        ...(userRole !== ROLES.STUDENT ? [{
            key: 'student',
            header: 'Assigned Student',
            renderCell: (visitor) => <AssignedStudentsDisplay students={visitor.linkedStudents || visitor.students} />
        }] : []),
        ...([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WARDEN].includes(userRole) ? [{
            key: 'room',
            header: 'Room No',
            accessor: (visitor) => {
                const students = visitor.linkedStudents || visitor.students;
                return students && students.length > 0
                    ? students.map(s => s.roomNumber || s).join(', ')
                    : '--';
            }, icon: DoorOpen
        }] : []),
        // ...(['admin', 'parent'].includes(userRole) ? [{
        //     key: 'hostel',
        //     header: 'Hostel',
        //     accessor: (visitor) => visitor.hostelName || '--',
        //     icon: Building
        // }] : []),
        {
            key: 'phone',
            header: 'Phone',
            accessor: (visitor) => visitor.phone || '--',
            icon: Phone
        },
        ...([ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MENTOR].includes(userRole) ? [{
            key: 'pendingRequestsCount',
            header: 'Pending Requests',
            accessor: (visitor) => visitor.pendingRequestsCount > 0 ? visitor.pendingRequestsCount : 'None',
            icon: Clock
        }] : []),
        {
            key: 'status',
            header: 'Status',
            renderCell: (visitor) => <StatusBadge status={visitor.status} />
        },
        ...(userRole === ROLES.PARENT ? [{
            key: 'actions',
            header: 'Actions',
            align: 'center',
            renderCell: (visitor) => (
                <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                        variant="ghost"
                        size="sm"
                        fullWidth={false}
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit && onEdit(visitor);
                        }}
                        className="p-1.5! bg-secondary/10 text-secondary hover:bg-secondary/20"
                        title="Edit"
                    >
                        <Edit className="w-4 h-4" />
                    </Button>
                </div>
            )
        }] : [])
    ];

    const cardConfig = {
        avatar: (visitor) => visitor.visitorName ? visitor.visitorName.split(' ').map(n => n[0]).join('').toUpperCase() : 'V',
        title: (visitor) => visitor.visitorName || visitor.name || 'Unknown',
        status: (visitor) => {
            const currentStatus = visitor.status ? visitor.status.toUpperCase() : 'UNKNOWN';
            let color = "gray";
            if (['CHECKED_IN', 'APPROVED', 'COMPLETED', 'ACTIVE'].includes(currentStatus)) color = "green";
            else if (['CHECKED_OUT', 'REJECTED', 'OVERSTAYED', 'INACTIVE', 'BLACKLISTED'].includes(currentStatus)) color = "red";
            else if (['EXTENDED', 'PENDING'].includes(currentStatus)) color = "yellow";

            return {
                text: visitor.status ? visitor.status.replace(/_/g, ' ') : 'Unknown',
                color
            };
        },
        fields: [
            // { icon: Phone, accessor: (visitor) => visitor.phone || '--' },
            ...(userRole !== ROLES.STUDENT ? [{
                icon: Users,
                accessor: (visitor) => <AssignedStudentsDisplay students={visitor.linkedStudents || visitor.students} />
            }, {
                icon: DoorOpen,
                accessor: (visitor) => {
                    const students = visitor.linkedStudents || visitor.students;
                    return students && students.length > 0
                        ? students.map(s => s.roomNumber || s).join(', ')
                        : '--';
                },
            }] : [])
        ],
        editable: userRole === ROLES.PARENT,
        onEdit: (visitor) => onEdit && onEdit(visitor),
        onClick: (visitor) => onRowClick && onRowClick(visitor)
    };

    const toolbarEndSlot = (
        <div className="flex items-center gap-2">
            <Dropdown
                options={[
                    { value: 'All', label: 'All Status' },
                    { label: 'Active', value: 'Active' },
                    { label: 'Inactive', value: 'Inactive' },
                    { label: 'Blacklisted', value: 'Blacklisted' },
                ]}
                value={statusFilter || 'All'}
                onChange={(val) => onStatusFilterChange(val === 'All' ? '' : val)}
                placeholder="Filter Status"
                minWidth="w-[140px]"
            />
            {canExport && (
                <Button
                    variant="outline"
                    fullWidth={false}
                    size="md"
                    onClick={onExportClick}
                >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export</span>
                </Button>
            )}

        </div>
    );


    const addButton = (
        <Button
            variant="primary"
            fullWidth={false}
            size="md"
            onClick={onRegisterClick}
        >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Register</span>
        </Button>
    )
    return (
        <DataView
            pageScrollMode={true}

            className="h-full border-none shadow-none bg-transparent"
            searchQuery={searchQuery}
            onSearchChange={(e) => onSearch(e.target.value)}
            searchPlaceholder="Search visitors..."
            toolbarEndSlot={toolbarEndSlot}
            columns={columns}
            cardConfig={cardConfig}
            data={visitors}
            loading={loading}
            emptyText="No visitors found."
            addButton={canRegister ? addButton : null}
            onRowClick={onRowClick}
            page={page}
            setPage={setPage}
            limit={limit}
            setLimit={setLimit}
            totalPages={pagination?.totalPages || 1}
            totalItems={pagination?.totalItems || 0}
        />
    );
};

export default VisitorListTableView;
