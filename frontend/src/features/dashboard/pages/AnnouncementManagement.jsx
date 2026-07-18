import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import { Loader2, Plus, Megaphone } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from '@/hooks/useTranslation';
import AnnouncementService from '@/services/announcement.service';
import AnnouncementList from '../components/announcements/AnnouncementList';
import AnnouncementFormModal from '../components/announcements/AnnouncementFormModal';
import ListToolbar from '@/components/ui/ListToolbar';
import { showSuccessToast, showErrorToast } from '@/utils/toast';

const AnnouncementManagement = () => {
    const { tab } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { t } = useTranslation();
    
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    // For Super Admin tabs
    const currentTab = tab || 'latest';
    const isSuperAdmin = user?.role === 'super_admin';

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const res = await AnnouncementService.getAnnouncements({});
            if (res && res.data) {
                setAnnouncements(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch announcements:", err);
            showErrorToast('Failed to load announcements');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const canCreate = ['super_admin', 'admin', 'warden'].includes(user?.role);

    // Filter based on tab for Super Admin and search query
    const displayAnnouncements = announcements.filter(a => {
        let matchesSearch = true;
        if (searchQuery) {
            matchesSearch = a.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            a.message?.toLowerCase().includes(searchQuery.toLowerCase());
        }
        if (!matchesSearch) return false;

        if (!isSuperAdmin) return true;
        if (currentTab === 'latest') {
            return a.isActive;
        }
        return true; 
    });

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-[#F8FAFC] text-black flex flex-col relative">
            <div className="p-4 md:p-6 flex-1 flex flex-col">
                <PageHeader
                    title="Announcements"
                    subtitle="Manage and view important announcements"
                    icon={Megaphone}
                />

                {isSuperAdmin && (
                    <div className="flex border-b border-gray-200 mt-4">
                        <button
                            onClick={() => navigate('/dashboard/announcements/latest')}
                            className={`py-3 px-6 text-sm font-medium border-b-2 ${
                                currentTab === 'latest' 
                                ? 'border-[#0A437A] text-[#0A437A]' 
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Latest Announcements
                        </button>
                        <button
                            onClick={() => navigate('/dashboard/announcements/history')}
                            className={`py-3 px-6 text-sm font-medium border-b-2 ${
                                currentTab === 'history' 
                                ? 'border-[#0A437A] text-[#0A437A]' 
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Announcement History
                        </button>
                    </div>
                )}

                <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:shadow-sm flex-1 flex flex-col mt-4 md:mt-6">
                    <ListToolbar
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        searchPlaceholder="Search announcements..."
                        onAdd={canCreate ? () => setIsModalOpen(true) : undefined}
                        addButtonLabel="Create Announcement"
                    />
                    
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <AnnouncementList announcements={displayAnnouncements} />
                    )}
                </div>

                <AnnouncementFormModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchAnnouncements();
                    }}
                />
            </div>
        </div>
    );
};

export default AnnouncementManagement;
