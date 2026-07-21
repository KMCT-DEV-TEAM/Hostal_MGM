import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import { Loader2, Plus, Megaphone } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from '@/hooks/useTranslation';
import AnnouncementService from '@/services/announcement.service';
import AnnouncementList from '../components/announcements/AnnouncementList';
import AnnouncementFormModal from '../components/announcements/AnnouncementFormModal';
import AnnouncementDetailModal from '../components/announcements/AnnouncementDetailModal';
import ListToolbar from '@/components/ui/ListToolbar';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { ROLES } from '@/constants/roles';
const AnnouncementManagement = () => {
    const { tab } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { t } = useTranslation();

    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const isStudentOrParent = [ROLES.STUDENT, ROLES.PARENT].includes(user?.role);

    useLayoutConfig(isStudentOrParent ? {
        header: { variant: 'page', title: 'Announcements', showBack: true },
        footer: { visible: true }
    } : {});

    const currentTab = tab || 'latest';
    const isSuperAdmin = user?.role === 'super_admin';
    const canManageTabs = ['super_admin', 'admin', 'warden'].includes(user?.role);

    const fetchAnnouncements = async (pageNum = 1) => {
        try {
            if (pageNum === 1) setLoading(true);
            else setLoadingMore(true);

            const apiStatus = canManageTabs ? (currentTab === 'latest' ? 'active' : currentTab) : 'active';

            const res = await AnnouncementService.getAnnouncements({
                page: pageNum,
                limit: 10,
                status: apiStatus,
                search: searchQuery
            });

            if (res && res.data) {
                if (pageNum === 1) {
                    setAnnouncements(res.data);
                } else {
                    setAnnouncements(prev => {
                        // Prevent duplicates by comparing IDs
                        const existingIds = new Set(prev.map(a => a._id));
                        const newItems = res.data.filter(a => !existingIds.has(a._id));
                        return [...prev, ...newItems];
                    });
                }
                if (res.pagination) {
                    setHasMore(res.pagination.hasMore);
                    setPage(res.pagination.page);
                }
            }
        } catch (err) {
            console.error("Failed to fetch announcements:", err);
            showErrorToast('Failed to load announcements');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        setPage(1);
        setHasMore(true);
        fetchAnnouncements(1);
    }, [currentTab, searchQuery]);

    const setObserverRef = useIntersectionObserver(() => {
        if (hasMore && !loadingMore && !loading) {
            fetchAnnouncements(page + 1);
        }
    }, { threshold: 0.1 });

    const canCreate = ['super_admin', 'admin', 'warden'].includes(user?.role);

    const handleEdit = (announcement) => {
        setSelectedAnnouncement(announcement);
        setIsModalOpen(true);
    };

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [announcementToDelete, setAnnouncementToDelete] = useState(null);

    const handleDelete = (announcement) => {
        setAnnouncementToDelete(announcement);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!announcementToDelete) return;
        try {
            await AnnouncementService.deleteAnnouncement(announcementToDelete._id);
            showSuccessToast("Announcement deleted successfully");
            setPage(1);
            fetchAnnouncements(1);
            setIsDetailModalOpen(false); // Close detail modal if open
        } catch (err) {
            console.error("Delete failed", err);
            showErrorToast("Failed to delete announcement");
        } finally {
            setDeleteConfirmOpen(false);
            setAnnouncementToDelete(null);
        }
    };

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-[#F8FAFC] text-black flex flex-col relative">
            <div className="p-4 md:p-6 flex-1 flex flex-col">
                {!isStudentOrParent && (
                    <PageHeader
                        title="Announcements"
                        subtitle="Manage and view important announcements"
                        icon={Megaphone}
                    />
                )}

                {canManageTabs && (
                    <div className="flex w-full border-b border-gray-200 mt-4">
                        <button
                            onClick={() => navigate('/dashboard/announcements/latest')}
                            className={`flex-1 py-3 px-2 md:px-6 text-xs md:text-sm font-medium border-b-2 text-center truncate ${currentTab === 'latest'
                                ? 'border-[#0A437A] text-[#0A437A]'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Announcement
                        </button>
                        <button
                            onClick={() => navigate('/dashboard/announcements/scheduled')}
                            className={`flex-1 py-3 px-2 md:px-6 text-xs md:text-sm font-medium border-b-2 text-center truncate ${currentTab === 'scheduled'
                                ? 'border-[#0A437A] text-[#0A437A]'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Scheduled
                        </button>
                        <button
                            onClick={() => navigate('/dashboard/announcements/history')}
                            className={`flex-1 py-3 px-2 md:px-6 text-xs md:text-sm font-medium border-b-2 text-center truncate ${currentTab === 'history'
                                ? 'border-[#0A437A] text-[#0A437A]'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            History
                        </button>
                    </div>
                )}

                <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:shadow-sm flex-1 flex flex-col  md:mt-6">
                    {!isStudentOrParent && <ListToolbar
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        searchPlaceholder="Search announcements..."
                        onAdd={canCreate ? () => { setSelectedAnnouncement(null); setIsModalOpen(true); } : undefined}
                        addButtonLabel="Announcement"
                    />}
                    <AnnouncementList
                        announcements={announcements}
                        loading={loading}
                        loadingMore={loadingMore}
                        observerRef={setObserverRef}
                        onAnnouncementClick={(announcement) => {
                            setSelectedAnnouncement(announcement);
                            setIsDetailModalOpen(true);
                        }}
                    />
                </div>

                <AnnouncementFormModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedAnnouncement(null);
                    }}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        setSelectedAnnouncement(null);
                        setPage(1);
                        fetchAnnouncements(1);
                    }}
                    announcementToEdit={selectedAnnouncement}
                />

                <AnnouncementDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={() => {
                        setIsDetailModalOpen(false);
                        setSelectedAnnouncement(null);
                    }}
                    announcement={selectedAnnouncement}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>

            <ConfirmationModal
                isOpen={deleteConfirmOpen}
                onClose={() => {
                    setDeleteConfirmOpen(false);
                    setAnnouncementToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Delete Announcement"
                message="Are you sure you want to delete this announcement? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
};

export default AnnouncementManagement;
