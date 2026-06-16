import React, { useState } from 'react';
import {
    Square, Pencil, Trash2, Plus, Search,
    ChevronDown, Download, SlidersHorizontal
} from 'lucide-react';

const INITIAL_STUDENTS = [
    { id: 1, admissionNo: 'A112390', name: 'Nila Mohan', course: 'B.Tech CSE', dept: 'CSE', orgId: 'A112390', hostel: 'Hostel A', status: 'Active' },
    // ... add more as needed
];

export default function Students() {
    const [students] = useState(INITIAL_STUDENTS);

    return (
        <div className="w-full min-h-screen bg-[#F8FAFC] p-6 text-gray-700">
            {/* Header Section */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Students</h1>
                    <p className="text-xs text-gray-400 mt-1">Manage all Students</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm font-medium hover:bg-gray-50">
                        <Pencil className="w-4 h-4" /> Edit
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-red-200 text-danger bg-red-50 rounded-lg text-sm font-medium hover:bg-red-100">
                        <Trash2 className="w-4 h-4" /> Delete
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 flex items-center justify-between">
                <div className="flex gap-3 flex-1">
                    <div className="relative w-64">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        <input className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Search" />
                    </div>
                    <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm">
                        <Plus className="w-4 h-4" /> Add New
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-gray-400 text-xs uppercase font-semibold border-b border-gray-50">
                            <th className="p-4 w-12"><Square className="w-5 h-5" /></th>
                            {['Admission No', 'Name', 'Course', 'Department', 'Org Id', 'Hostel', 'Status', 'Action'].map(h => (
                                <th key={h} className="p-4">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                        {students.map((s) => (
                            <tr key={s.id} className="hover:bg-gray-50/40">
                                <td className="p-4"><Square className="w-5 h-5 text-gray-300" /></td>
                                <td className="p-4">{s.admissionNo}</td>
                                <td className="p-4 flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-[#0A437A] text-white flex items-center justify-center font-bold text-[10px]">NM</div>
                                    {s.name}
                                </td>
                                <td className="p-4 text-gray-600">{s.course}</td>
                                <td className="p-4 text-gray-600">{s.dept}</td>
                                <td className="p-4 text-gray-600">{s.orgId}</td>
                                <td className="p-4">
                                    <select className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-transparent">
                                        <option>{s.hostel}</option>
                                    </select>
                                </td>
                                <td className="p-4">
                                    <div className="relative w-fit mx-auto">
                                        <select
                                            value={s.status}
                                            onChange={(e) =>
                                                handleStatusChange(s.id, e.target.value)
                                            }
                                            className={`appearance-none rounded-full pl-4 pr-8 py-1 text-xs font-medium border
                                       ${s.status === "Active"
                                                    ? "bg-green-50 text-success border-green-100"
                                                    : "bg-red-50 text-danger border-red-100"
                                                }`}
                                        >
                                            <option>Active</option>
                                            <option>Inactive</option>
                                        </select>

                                        <ChevronDown
                                            size={12}
                                            className={`absolute right-3 top-2
                                       ${s.status === "Active"
                                                    ? "text-success"
                                                    : "text-danger"
                                                }`}
                                        />
                                    </div>
                                </td>
                                <td className="p-4 flex gap-3 text-gray-400">
                                    <Trash2 className="w-4 h-4 cursor-pointer text-secondary" />
                                    <Pencil className="w-4 h-4 cursor-pointer text-secondary" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}