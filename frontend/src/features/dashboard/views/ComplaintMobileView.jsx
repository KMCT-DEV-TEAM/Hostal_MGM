import React, { useState } from 'react';
import MobileListContainer from '@/components/MobileUi/MobileListContainer';
import { Droplet, Lightbulb, Wifi, PenSquare, Wrench } from 'lucide-react';
import { formatTimeAgo } from '@/utils/formatters';
import StatusBadge from '@/components/ui/StatusBadge';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';

const ComplaintMobileView = ({
  loading,
  complaints,
  totalMobileStats,
  categories,
  openEditModal,
  onViewDetail,
  searchValue,
  onSearchChange,
  activeTab = 'My complaints',
  onTabChange,
}) => {

  useLayoutConfig();


  // Filter based on selected tab


  // Generate a consistent color variant based on the category name
  const getColorVariant = (str) => {
    const variants = [
      { text: 'text-blue-500', bg: 'bg-blue-50' },
      { text: 'text-orange-500', bg: 'bg-orange-50' },
      { text: 'text-green-500', bg: 'bg-green-50' },
      { text: 'text-purple-500', bg: 'bg-purple-50' },
      { text: 'text-pink-500', bg: 'bg-pink-50' },
      { text: 'text-indigo-500', bg: 'bg-indigo-50' },
      { text: 'text-teal-500', bg: 'bg-teal-50' }
    ];
    if (!str) return variants[0];

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % variants.length;
    return variants[index];
  };

  // Use a single unified icon, but dynamic colors
  const getIconInfo = (categoryName) => {
    const { text, bg } = getColorVariant(categoryName);
    return { icon: <Wrench className={`w-5 h-5 ${text}`} />, bg };
  };

  const listStats = activeTab === 'History' && totalMobileStats ? [
    { value: String(totalMobileStats.total).padStart(2, '0'), label: 'Total', valueColor: 'text-[#0A437A]' },
    { value: String(totalMobileStats.resolved).padStart(2, '0'), label: 'Resolved', valueColor: 'text-green-500' },
    { value: String(totalMobileStats.pending).padStart(2, '0'), label: 'Pending', valueColor: 'text-orange-500' }
  ] : null;

  const renderItem = (complaint) => {
    const iconInfo = getIconInfo(complaint.category);
    const timeAgo = formatTimeAgo(complaint.createdAt || complaint.date);

    return (
      <div
        key={complaint._id || Math.random()}
        onClick={() => onViewDetail(complaint)}
        className="bg-white rounded-[16px] p-4 shadow-sm border border-gray-50 flex gap-4 items-start active:scale-[0.98] transition-transform cursor-pointer"
      >
        <div className={`p-3 rounded-full ${iconInfo.bg} shrink-0 mt-0.5`}>
          {iconInfo.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h4 className="font-semibold text-gray-900 text-[15px] truncate pr-2">
              {complaint.subject} {complaint.roomNo ? `- Room ${complaint.roomNo}` : ''}
            </h4>
            <span className="text-[11px] text-gray-400 whitespace-nowrap shrink-0 pt-0.5">{timeAgo}</span>
          </div>

          <p className="text-[13px] text-gray-500 mb-3 line-clamp-1 pr-4">
            {complaint.description || complaint.category}
          </p>

          <div className="flex justify-between items-center">
            <StatusBadge status={complaint.status || 'Pending'} />

            {complaint.status === 'Pending' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(complaint);
                }}
                className="p-1 text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
              >
                <PenSquare className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full">
      <div className="px-5 pt-6 pb-4 shrink-0">
        <h3 className="text-[19px] font-bold text-gray-900 mb-5">complaint Management</h3>

        <div className="bg-white rounded-[14px] p-1 flex shadow-sm border border-gray-50">
          <button
            onClick={() => onTabChange('My complaints')}
            className={`flex-1 text-center py-2.5 text-[13px] font-semibold rounded-[10px] transition-all duration-200 ${activeTab === 'My complaints'
              ? 'bg-[#0A437A] text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50'
              }`}
          >
            My complaints
          </button>
          <button
            onClick={() => onTabChange('History')}
            className={`flex-1 text-center py-2.5 text-[13px] font-semibold rounded-[10px] transition-all duration-200 ${activeTab === 'History'
              ? 'bg-[#0A437A] text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50'
              }`}
          >
            History
          </button>
        </div>
      </div>



      <div className="flex-1 px-5 pb-4">
        <MobileListContainer
          showSearch={true}
          searchPlaceholder="Search requests..."
          searchValue={searchValue}
          onSearchChange={(val) => {
            if (onSearchChange) onSearchChange({ target: { value: val } });
          }}
          onAddClick={() => openEditModal(null)}
          data={complaints}
          renderItem={renderItem}
          stats={listStats}
          isLoading={loading}
          emptyMessage={`No ${activeTab === 'History' ? 'historical' : 'active'} complaints found.`}
        />
      </div>
    </div>
  );
};

export default ComplaintMobileView;
