import React, { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Dropdown from "@/components/ui/Dropdown";
import courseService from "@/services/course.service";
import departmentService from "@/services/department.service";

import { ROLES } from "@/constants/roles";
export default function StudentExportFilterModal({
  isOpen,
  onClose,
  onExport,
  role,
  isExporting,
  title = "Export Students Data",
  subtitle = "Select filters to apply before downloading",
}) {
  const [statusFilter, setStatusFilter] = useState("");
  const [courseId, setCourseId] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  const statusOptions = [
    { label: "All Status", value: "" },
    { label: "Active Only", value: "true" },
    { label: "Inactive Only", value: "false" },
  ];

  // Reset filters whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setStatusFilter("");
      setCourseId("");
      setDepartmentId("");
    }
  }, [isOpen]);

  // Load courses once when the modal opens
  useEffect(() => {
    if (!isOpen) return;
    let isCurrent = true;
    setLoadingCourses(true);
    courseService
      .getCourses({ status: "Active" })
      .then((res) => {
        if (isCurrent) setCourses(res.data || []);
      })
      .catch((error) => {
        console.error("Failed to load courses", error);
      })
      .finally(() => {
        if (isCurrent) setLoadingCourses(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [isOpen]);

  // Load departments whenever the selected course changes
  useEffect(() => {
    if (!courseId) {
      setDepartments([]);
      return;
    }
    let isCurrent = true;
    setLoadingDepartments(true);
    departmentService
      .getDepartments({ courseId, status: "Active" })
      .then((res) => {
        if (isCurrent) setDepartments(res.data || []);
      })
      .catch((error) => {
        console.error("Failed to load departments", error);
      })
      .finally(() => {
        if (isCurrent) setLoadingDepartments(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [courseId]);

  if (!isOpen) return null;

  const courseOptions = [
    { label: "All Courses", value: "" },
    ...courses.map((c) => ({ label: c.name, value: c._id })),
  ];

  const departmentOptions = [
    { label: courseId ? "All Departments" : "Select a course first", value: "" },
    ...departments.map((d) => ({ label: d.name, value: d._id })),
  ];

  const handleCourseChange = (value) => {
    setCourseId(value);
    setDepartmentId(""); // reset dependent filter
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onExport({
      isActive: statusFilter,
      course: courseId,
      department: departmentId,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      maxWidth="max-w-md"
      asForm
      onSubmit={handleSubmit}
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 border border-gray-200 rounded-md text-xs font-medium hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isExporting}
            className="px-5 py-2 bg-[#0A437A] text-white rounded-md text-xs font-medium hover:bg-[#083663] disabled:opacity-50 flex items-center justify-center min-w-[120px] cursor-pointer"
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              "Export to Excel"
            )}
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="relative" style={{ zIndex: 20 }}>
          <label className="block mb-1.5 text-xs font-medium text-gray-700">
            Account Status
          </label>
          <Dropdown
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-full"
          />
        </div>

        <div className="relative" style={{ zIndex: 19 }}>
          <label className="block mb-1.5 text-xs font-medium text-gray-700">
            Course
          </label>
          <Dropdown
            options={courseOptions}
            value={courseId}
            onChange={handleCourseChange}
            className="w-full"
          />
          {loadingCourses && (
            <p className="text-xs text-text-secondary mt-1">Loading courses...</p>
          )}
        </div>

       
       {role === ROLES.SUPER_ADMIN && (
  <div className="relative sm:col-span-2" style={{ zIndex: 18 }}>
    <label className="block mb-1.5 text-xs font-medium text-gray-700">
      Department
    </label>

    <Dropdown
      options={departmentOptions}
      value={departmentId}
      onChange={setDepartmentId}
      disabled={!courseId}
      className="w-full"
    />

    {loadingDepartments && (
      <p className="text-xs text-text-secondary mt-1">
        Loading departments...
      </p>
    )}
  </div>
)}
      </div>
    </Modal>
  );
}