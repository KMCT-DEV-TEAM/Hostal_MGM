import React from 'react';
import DataView from '@/components/ui/data-view/DataView';
import { Edit, Phone, Building, Users, Download, Plus, DoorOpen, Handshake } from 'lucide-react';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import Dropdown from '@/components/ui/Dropdown';

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
        ...(userRole !== 'student' ? [{
            key: 'student',
            header: 'Visiting Student',
            accessor: (visitor) => {
                const students = visitor.linkedStudents || visitor.students;
                return students && students.length > 0
                    ? students.map(s => s.name || s).join(', ')
                    : '--';
            },
            icon: Users
        }] : []),
        ...(['super_admin', 'admin', 'warden'].includes(userRole) ? [{
            key: 'room',
            header: 'Room No',
            accessor: (visitor) => {
                const students = visitor.linkedStudents || visitor.students;
                return students && students.length > 0
                    ? students.map(s => s.roomNumber || s).join(', ')
                    : '--';
            }, icon: DoorOpen
        }] : []),
        ...(['warden', 'super_admin'].includes(userRole) ? [{
            key: 'organization',
            header: 'Organization',
            accessor: (visitor) => visitor.organizationName || '--',
            icon: Building
        }] : []),
        ...(['admin', 'parent'].includes(userRole) ? [{
            key: 'hostel',
            header: 'Hostel',
            accessor: (visitor) => visitor.hostelName || '--',
            icon: Building
        }] : []),
        {
            key: 'phone',
            header: 'Phone',
            accessor: (visitor) => visitor.phone || '--',
            icon: Phone
        },
        {
            key: 'relation',
            header: 'Relation',
            accessor: (visitor) => visitor.relationship || visitor.relation || '--',
            icon: Handshake
        },
        {
            key: 'status',
            header: 'Status',
            renderCell: (visitor) => <StatusBadge status={visitor.status} />
        },
        ...(userRole === 'parent' ? [{
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
        // subtitle: (visitor) => visitor.phone || '--',
        status: (visitor) => ({
            text: visitor.status || 'Unknown',
            color: ['Checked_in', 'Approved', 'Completed'].includes(visitor.status) ? "green"
                : ['Checked_out', 'Rejected', 'Overstayed', 'Inactive'].includes(visitor.status) ? "red"
                    : ['Extended', 'Pending'].includes(visitor.status) ? "yellow"
                        : "gray"
        }),
        fields: [
            // { icon: Phone, accessor: (visitor) => visitor.phone || '--' },
            ...(userRole !== 'student' ? [{
                icon: Users,
                accessor: (visitor) => {
                    const students = visitor.linkedStudents || visitor.students;
                    return students && students.length > 0 ? students.map(s => s.name || s).join(', ') : '--';
                }
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
        editable: userRole === 'parent',
        onEdit: (visitor) => onEdit && onEdit(visitor),
        onClick: (visitor) => onRowClick && onRowClick(visitor)
    };

    const toolbarEndSlot = (
        <div className="flex items-center gap-2">
            <Dropdown
                options={[
                    { value: 'All', label: 'All Status' },
                    { value: 'Pending', label: 'Pending' },
                    { value: 'Approved', label: 'Approved' },
                    { value: 'Rejected', label: 'Rejected' }
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
