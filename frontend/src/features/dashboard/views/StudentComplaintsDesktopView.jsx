import React from 'react';
import StudentComplaintsTable from '../components/complaints/StudentComplaintsTable';
import StudentComplaintsHeader from '../components/complaints/StudentComplaintsHeader';
import { AlertTriangle, CheckCircle, Clock, Loader2 } from 'lucide-react';

/**
 * Desktop view component for Student Complaints.
 * Mirrors the existing desktop UI implementation.
 * Props are passed through to the underlying StudentComplaintsTable.
 */
const StudentComplaintsDesktopView = ({
  loading,
  complaints,
  categories,
  handleCategoryChange,
  openEditModal,
  onViewDetail,
  page,
  setPage,
  limit,
  setLimit,
  totalPages,
  totalItems,
  searchValue,
  onSearchChange,
  toolbarStartSlot,
  toolbarEndSlot,
}) => {
  return (
    <div className="w-full h-full p-6 flex flex-col bg-background-secondary">
      <StudentComplaintsHeader />
      {/* Stat Cards Section */}
      <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 mb-4">
        <div className="bg-white rounded-lg p-5 border-t-[2px] border-t-danger shadow-sm border border-gray-100 flex justify-between items-start">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Total Complaints</p>
            <h3 className="text-2xl font-bold text-gray-900">{complaints.length}</h3>
          </div>
          <div className="p-1.5 bg-red-50 rounded text-danger">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-5 border-t-[2px] border-t-warning shadow-sm border border-gray-100 flex justify-between items-start">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Pending</p>
            <h3 className="text-2xl font-bold text-gray-900">{complaints.filter(c => c.status === 'Pending').length}</h3>
          </div>
          <div className="p-1.5 bg-orange-50 rounded text-warning">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-5 border-t-[2px] border-t-primary/80 flex justify-between items-start">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">In Progress</p>
            <h3 className="text-2xl font-bold text-gray-900">{complaints.filter(c => c.status === 'In progress').length}</h3>
          </div>
          <div className="p-1.5 bg-blue-50 rounded text-primary">
            <Loader2 className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-5 border-t-[2px] border-t-success shadow-sm border border-gray-100 flex justify-between items-start">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Resolved</p>
            <h3 className="text-2xl font-bold text-gray-900">{complaints.filter(c => c.status === 'Resolved').length}</h3>
          </div>
          <div className="p-1.5 bg-green-50 rounded text-green-500">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>
      <StudentComplaintsTable
        loading={loading}
        complaints={complaints}
        categories={categories}
        handleCategoryChange={handleCategoryChange}
        openEditModal={openEditModal}
        onViewDetail={onViewDetail}
        page={page}
        setPage={setPage}
        limit={limit}
        setLimit={setLimit}
        totalPages={totalPages}
        totalItems={totalItems}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        toolbarStartSlot={toolbarStartSlot}
        toolbarEndSlot={toolbarEndSlot}
      />
    </div>
  );
};

export default StudentComplaintsDesktopView;
