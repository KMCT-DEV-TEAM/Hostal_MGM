import React from 'react';
import { X, Calendar, User, Target, Clock, Edit2, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

const AnnouncementDetailModal = ({ isOpen, onClose, announcement, onEdit, onDelete }) => {
    const { user } = useAuthStore();
    if (!isOpen || !announcement) return null;

    const canEdit = (user?.role === 'super_admin' || 
                    announcement.createdBy?._id === user?._id || 
                    announcement.createdBy === user?._id) && 
                    announcement.status !== 'deleted' && 
                    announcement.status !== 'expired';

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-slide-up sm:animate-none">
                <div className="px-6 py-4 border-b flex justify-between items-center gap-4 bg-gray-50/50">
                    <h2 className="text-lg font-semibold text-gray-900 break-all flex-1" title={announcement.title}>
                        {announcement.title}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            {announcement.status && (
                                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                                    announcement.status === 'active' ? 'bg-green-100 text-green-700' :
                                    announcement.status === 'scheduled' ? 'bg-orange-100 text-orange-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                    {announcement.status.charAt(0).toUpperCase() + announcement.status.slice(1)}
                                </span>
                            )}
                            <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(announcement.createdAt)}</span>
                            </div>
                        </div>

                        <div className="text-gray-700 whitespace-pre-wrap break-all leading-relaxed">
                            {announcement.message}
                        </div>

                        <div className="mt-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 px-1">Announcement Details</h3>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                                    <div className="p-2 bg-blue-100/50 text-blue-600 rounded-lg flex-shrink-0">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 font-medium mb-0.5">Created By</div>
                                        <div className="text-sm text-gray-800 capitalize font-medium">
                                            {announcement.createdBy?.name || 'Admin'} 
                                            {announcement.creatorRole && ` (${announcement.creatorRole.replace('_', ' ')})`}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                                    <div className="p-2 bg-purple-100/50 text-purple-600 rounded-lg flex-shrink-0">
                                        <Target className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 font-medium mb-0.5">Target Audience</div>
                                        <div className="text-sm text-gray-800 capitalize font-medium">{announcement.targetType}</div>
                                    </div>
                                </div>

                                {announcement.status === 'scheduled' && announcement.scheduledAt && (
                                    <div className="flex items-center gap-3 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                                        <div className="p-2 bg-orange-100/50 text-orange-600 rounded-lg flex-shrink-0">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 font-medium mb-0.5">Scheduled For</div>
                                            <div className="text-sm text-orange-700 font-medium">
                                                {formatDate(announcement.scheduledAt)}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {announcement.expiresAt && (
                                    <div className="flex items-center gap-3 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                                        <div className="p-2 bg-gray-200/50 text-gray-600 rounded-lg flex-shrink-0">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 font-medium mb-0.5">Expires At</div>
                                            <div className="text-sm text-gray-700 font-medium">
                                                {formatDate(announcement.expiresAt)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {canEdit && (
                    <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap justify-end gap-3 bg-gray-50/50">
                        <button
                            onClick={() => {
                                onClose();
                                onEdit && onEdit(announcement);
                            }}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 flex items-center gap-2 transition-colors"
                        >
                            <Edit2 className="w-4 h-4" />
                            Edit
                        </button>
                        <button
                            onClick={() => {
                                onClose();
                                onDelete && onDelete(announcement);
                            }}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnnouncementDetailModal;
