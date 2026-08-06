import React from 'react';
import DataView from '@/components/ui/data-view/DataView';
import { Edit, Phone, Building, Users, Download, Plus, DoorOpen, Handshake, Clock } from 'lucide-react';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import Dropdown from '@/components/ui/Dropdown';
import { ROLES } from '@/constants/roles';

const AssignedStudentsDisplay = ({ students }) => {
    if (!students || students.length === 0) return <span className="text-text-secondary">--</span>;

    const firstStudent = students[0];
    const hasMore = students.length > 1;

    return (
        <div className="flex items-center gap-1.5 relative group cursor-default">
            <span className="font-medium text-text-primary truncate max-w-30" title={firstStudent.name || firstStudent}>
                {firstStudent.name || firstStudent}
            </span>
            {hasMore && (
                <span className="text-primary text-xs font-semibold px-1.5 py-0.5 bg-primary/10 rounded cursor-pointer whitespace-nowrap">
                    +{students.length - 1}
                </span>
            )}

            {hasMore && (
                <div className="absolute left-0 top-full mt-2 w-56 bg-white border border-gray-200 shadow-xl rounded-xl p-3 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 before:absolute before:-top-2 before:left-4 before:w-4 before:h-4 before:bg-white before:border-l before:border-t before:border-gray-200 before:rotate-45">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 relative z-10">
                        <h4 className="text-sm font-semibold text-text-primary">Assigned Students</h4>
                    </div>
                    <div className="flex flex-col gap-3 max-h-48 overflow-y-auto relative z-10">
                        {students.map((student, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-xs shrink-0">
                                    {(student.name || 'S').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-sm font-medium text-text-primary truncate" title={student.name || student}>
                                        {student.name || student}
                                    </span>
                                    {(student.roomNumber || student.grade) && (
                                        <span className="text-[11px] text-text-secondary truncate">
                                            {student.roomNumber && `Room ${student.roomNumber}`}
                                            {student.roomNumber && student.grade && ' • '}
                                            {student.grade && `Grade ${student.grade}`}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

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
