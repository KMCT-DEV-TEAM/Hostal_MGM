import React from 'react';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { formatDateReadable, formatTime } from '@/utils/formatters';
import TimelineStep from '@/components/ui/TimelineStep';
import StatusBadge from '@/components/ui/StatusBadge';

export default function VisitorDetailsMobileView({ data, onBack }) {
    useLayoutConfig({
        header: {
            variant: 'page',
            title: 'Visitor Details',
            showBack: true,
            onBack: onBack
        },
        footer: {
            visible: false
        }
    });

    if (!data) return null;

    // Handle structured Visit details payload vs raw Visitor profile payload
    const isVisit = !!data?.visitInformation;

    let visitorName = 'Unknown';
    let relation = 'N/A';
    let phone = 'N/A';
    let email = 'N/A';
    let idType = 'N/A';
    let idNumber = 'N/A';
    let visitDate = '--';
    let purpose = '--';
    let duration = 'N/A';
    let checkInTimeStr = null;
    let checkOutTimeStr = null;

    if (isVisit) {
        const vInfo = data.visitorInformation;
        const viInfo = data.visitInformation;
        const qSum = data.quickSummary;

        visitorName = vInfo?.name || qSum?.visitorName || 'Unknown';
        relation = vInfo?.relation || 'N/A';
        phone = vInfo?.phone || 'N/A';
        email = vInfo?.email || 'N/A';
        idType = vInfo?.idProofType || 'N/A';
        idNumber = vInfo?.idNumber || 'N/A';

        visitDate = viInfo?.checkInTime ? formatDateReadable(viInfo.checkInTime) : '--';
        purpose = viInfo?.purpose || '--';
        duration = viInfo?.visitDuration || '--';

        checkInTimeStr = viInfo?.checkInTime ? `${formatDateReadable(viInfo.checkInTime)} | ${formatTime(viInfo.checkInTime)}` : null;
        checkOutTimeStr = viInfo?.checkOutTime ? `${formatDateReadable(viInfo.checkOutTime)} | ${formatTime(viInfo.checkOutTime)}` : null;
    } else {
        // Fallback for simple profile based on flat JSON response
        visitorName = data?.name || data?.visitorName || 'Unknown';
        relation = data?.relationship || 'N/A';
        phone = data?.phone || 'N/A';
        email = data?.email || 'N/A';
        idType = data?.idProofType || 'N/A';
        idNumber = data?.idProofNumber || 'N/A';
    }

    const renderField = (label, value) => (
        <div className="flex flex-col mb-4 last:mb-0">
            <span className="text-[11px] font-medium text-text-secondary mb-1">{label}</span>
            <span className="text-[13px] font-medium text-text-primary break-words whitespace-pre-wrap">{value}</span>
        </div>
    );

    return (
        <div className="w-full h-full overflow-y-auto bg-gray-50/50 p-4 space-y-4 pb-20">

            {/* BASIC INFO CARD */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                <h4 className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-4">
                    Basic Info
                </h4>

                {renderField("Name", visitorName)}
                {renderField("Phone Number", phone)}
                {renderField("Email Address", email)}
                {relation !== 'N/A' && renderField("Relation", relation)}
                {renderField("Id Proof type", idType)}
                {renderField("Id Number", idNumber)}
            </div>

            {/* VISIT DETAILS CARD */}
            {isVisit && (
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                    <h4 className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-4">
                        Visit Details
                    </h4>

                    <div className="flex items-center gap-6 mb-4">
                        <div className="flex-1">
                            <span className="block text-[11px] font-medium text-gray-400 mb-1">Date</span>
                            <span className="block text-[13px] font-medium text-text-primary">{visitDate}</span>
                        </div>
                        <div className="flex-1 border-l border-gray-100 pl-6">
                            <span className="block text-[11px] font-medium text-gray-400 mb-1">Duration</span>
                            <span className="block text-[13px] font-medium text-text-primary">{duration}</span>
                        </div>
                    </div>

                    <div className="w-full h-px bg-gray-100 my-4"></div>

                    <div className="flex flex-col">
                        <span className="text-[11px] font-medium text-gray-400 mb-1">Purpose</span>
                        <span className="text-[13px] font-medium text-text-primary">{purpose}</span>
                    </div>
                </div>
            )}

            {/* VISIT TIMELINE CARD */}
            {isVisit && (
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                    <h4 className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-4">
                        Visit Timeline
                    </h4>

                    <div className="relative pl-8 space-y-6 before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-0.5 before:bg-gray-100">

                        {/* Check Out Step */}
                        <TimelineStep
                            title="Check Out"
                            subtitle={visitorName}
                            formattedDate={checkOutTimeStr || 'Pending'}
                            badgeLabel={checkOutTimeStr ? "Completed" : "Pending"}
                            badgeColor={checkOutTimeStr ? "text-success" : "text-warning"}
                            badgeBg={checkOutTimeStr ? "bg-success/10" : "bg-warning/10"}
                            nodeColor={checkOutTimeStr ? "bg-success" : "bg-danger"}
                            avatarBg="bg-gray-100"
                            avatarColor="text-gray-600"
                        />

                        {/* Check In Step */}
                        <TimelineStep
                            title="Check In"
                            subtitle={visitorName}
                            formattedDate={checkInTimeStr || 'Pending'}
                            badgeLabel={checkInTimeStr ? "Completed" : "Pending"}
                            badgeColor={checkInTimeStr ? "text-success" : "text-warning"}
                            badgeBg={checkInTimeStr ? "bg-success/10" : "bg-warning/10"}
                            nodeColor="bg-success"
                            avatarBg="bg-gray-100"
                            avatarColor="text-gray-600"
                        />

                    </div>
                </div>
            )}
            {/* LINKED STUDENTS */}
            {!isVisit && data?.linkedStudents && data.linkedStudents.length > 0 && (
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                    <h4 className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-4">
                        Linked Students
                    </h4>
                    <div className="flex flex-col gap-4">
                        {data.linkedStudents.map((student, idx) => (
                            <div key={idx} className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h5 className="text-[14px] font-semibold text-text-primary">{student.name}</h5>
                                        <span className="text-[11px] text-text-secondary">{student.sHostelName} • Room {student.roomNumber}</span>
                                    </div>
                                    <StatusBadge status={student.requestStatus} />
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    {renderField("Relationship", student.relationship)}
                                </div>
                                <div className="w-full">
                                    {renderField("Purpose", student.purpose)}
                                </div>
                                
                                {student.approvalTimeline && student.approvalTimeline.length > 0 && (
                                    <div className="mt-2 pt-4 border-t border-gray-200">
                                        <h6 className="text-[11px] font-semibold text-text-secondary mb-4 uppercase tracking-wide">Approval History</h6>
                                        <div className="relative pl-7 space-y-5 before:absolute before:top-1.5 before:bottom-1.5 before:left-[11px] before:w-0.5 before:bg-gray-200">
                                            {student.approvalTimeline.map((item, i) => {
                                                const isApp = item.action === 'Approved';
                                                const isRej = item.action === 'Rejected';
                                                const dotColor = isApp ? 'bg-success' : isRej ? 'bg-danger' : 'bg-primary';
                                                return (
                                                    <div key={i} className="relative">
                                                        <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ${dotColor} border-2 border-white shadow-sm z-10`} />
                                                        <div className="flex flex-col">
                                                            <span className="text-[12px] font-medium text-text-primary">{item.action}</span>
                                                            {item.remarks && <span className="text-[11px] text-text-secondary mt-0.5">{item.remarks}</span>}
                                                            <span className="text-[10px] text-gray-400 mt-1">{formatDateReadable(item.createdAt)} | {formatTime(item.createdAt)}</span>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* PROFILE HISTORY */}
            {!isVisit && data?.changeLog && data.changeLog.length > 0 && (
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                    <h4 className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-4">
                        Profile History
                    </h4>
                    <div className="relative pl-8 space-y-6 before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-0.5 before:bg-gray-100">
                        {data.changeLog.map((item, idx) => (
                            <TimelineStep
                                key={idx}
                                title={item.action}
                                subtitle={`${(item.performedByRole || 'System').toUpperCase()} Action`}
                                formattedDate={`${formatDateReadable(item.timestamp)} | ${formatTime(item.timestamp)}`}
                                badgeLabel={item.action}
                                badgeColor="text-primary"
                                badgeBg="bg-primary/10"
                                nodeColor="bg-primary"
                                avatarBg="bg-gray-100"
                                avatarColor="text-gray-600"
                            />
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}
