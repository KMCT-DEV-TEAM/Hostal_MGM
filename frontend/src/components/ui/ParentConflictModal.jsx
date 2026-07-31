import React from "react";
import { CheckCircle2, Mail, Phone } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";

export default function ParentConflictModal({
  isOpen,
  onClose,
  conflictData,
  isResolvingConflict,
  onResolve,
}) {
  if (!isOpen || !conflictData) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={<span className="text-primary font-semibold text-lg">Existing Parent Account Found</span>}
      subtitle={<span className="text-gray-500">This email is already registered with another parent account.</span>}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3 text-sm text-gray-600 py-4 border-b border-gray-100">
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
          </div>
          We'll link the student to the existing parent account.
        </div>

        <div className="p-6 border border-gray-100 rounded-xl bg-white shadow-sm">
          <h4 className="text-sm font-semibold text-primary mb-5">Parent Details</h4>
          <div className="grid grid-cols-3 gap-6 pt-4 border-t border-gray-100">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Full Name</p>
              <p className="text-sm font-medium text-gray-900">{conflictData.existing.name}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Email Address</p>
              <p className="text-sm text-gray-800 flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                {conflictData.existing.email}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Phone Number</p>
              <p className="text-sm text-gray-800 flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                +91 {conflictData.existing.phone}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border border-gray-100 rounded-xl bg-white shadow-sm">
          <h4 className="text-sm font-semibold text-primary mb-5">Linked Students ( {conflictData.existing.linkedStudents?.length || 0} )</h4>
          <div className="space-y-4 pt-4 border-t border-gray-100">
            {conflictData.existing.linkedStudents?.map((ls, idx) => (
              <div key={idx} className="flex items-center justify-between pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-medium tracking-wider">
                    {ls.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{ls.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-800 font-medium">{ls.course}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{ls.academicYear}</p>
                </div>
              </div>
            ))}
            {(!conflictData.existing.linkedStudents || conflictData.existing.linkedStudents.length === 0) && (
              <p className="text-sm text-gray-500 italic">No linked students found.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <Button
            variant="primary"
            disabled={isResolvingConflict}
            onClick={() => onResolve('update_existing')}
          >
            Continue With Updated Data
          </Button>
          <Button
            variant="outline"
            className="border-primary text-primary hover:bg-primary/5"
            disabled={isResolvingConflict}
            onClick={() => onResolve('use_existing')}
          >
            Link with Existing Parent
          </Button>
        </div>
      </div>
    </Modal>
  );
}
