import React, { useState } from 'react';
import {
    Square, CheckSquare, Pencil, Trash2, Plus,
    Search, ChevronDown, Download, Phone, Mail, User
} from 'lucide-react';

const INITIAL_PARENTS = [
    { id: 1, name: 'Jacob Tarakan', email: 'anilkumar@gmail.com', phone: '9987898789', student: 'Nila Mohan', relation: 'Father', status: 'Active' },
    { id: 2, name: 'Jacob Tarakan', email: 'anilkumar@gmail.com', phone: '9987898789', student: 'Nila Mohan', relation: 'Mother', status: 'Inactive' },
    // ... add more as needed
];
const handleSelectAll = () => {
    setSelectedIds(selectedIds.length === parents.length ? [] : parents.map(p => p.id));
};

export default function Parents() {
    const [parents] = useState(INITIAL_PARENTS);
    const [selectedIds, setSelectedIds] = useState([]);

    return (
        <div className="w-full min-h-screen bg-[#F8FAFC] p-6 text-gray-700">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Parents</h1>
                    <p className="text-xs text-gray-400 mt-1">Manage all Parents</p>
                </div>
                <div className="flex items-center gap-3">
                    {selectedIds.length === 1 && (
                        <button
                            onClick={() => {
                                const target = parents.find(w => w.id === selectedIds[0]);
                                if (target) openEditParentModal(target);
                            }}
                            className="flex items-center gap-2 px-4 py-2 border border-[#0A437A] text-[#0A437A] bg-blue-50/40 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                        >
                            <Pencil className="w-4 h-4" />
                            Edit
                        </button>
                    )}

                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            className="flex items-center gap-2 px-4 py-2 border border-red-200 text-danger rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete ({selectedIds.length})
                        </button>
                    )}
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 flex items-center justify-between">
                <div className="flex gap-3">
                    <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                        <option>All</option>
                    </select>
                    <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                        <option>Relation</option>
                    </select>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        <input className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64" placeholder="Search" />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm">
                        <Download className="w-4 h-4" /> Export
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[#222222] text-sm font-semibold border-b border-gray-50">
                            <th className="text-gray-300 p-4 w-12"><button onClick={handleSelectAll}>{selectedIds.length === parents.length ? <CheckSquare className=" h-5 w-5 text-[#0A437A]" /> : <Square className="h-5 w-5 text-gray-300" />}</button></th>
                            {['Name', 'Email', 'Phone', 'Student', 'Relation', 'Status', 'Action'].map(h => (
                                <th key={h} className="p-4">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm text-[#777777]">
                        {parents.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50/40">
                                <td className="p-4"><Square className="w-5 h-5 text-gray-300" /></td>
                                <td className="p-4 flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-[#0A437A] text-white flex items-center justify-center font-bold text-xs">JT</div>
                                    {p.name}
                                </td>
                                <td className="p-4 text-gray-500"><Mail className="w-3 h-3 inline mr-2" />{p.email}</td>
                                <td className="p-4 text-gray-500"><Phone className="w-3 h-3 inline mr-2" />{p.phone}</td>
                                <td className="p-4 text-gray-500">{p.student}</td>
                                <td className="p-4">
                                    <select className="border border-gray-200 rounded-lg px-2 py-1 text-xs">
                                        <option>{p.relation}</option>
                                    </select>
                                </td>
                                <td className="p-4">
                                    <div className="relative w-fit mx-auto">
                                        <select
                                            value={p.status}
                                            onChange={(e) =>
                                                handleStatusChange(o.id, e.target.value)
                                            }
                                            className={`appearance-none rounded-full pl-4 pr-8 py-1 text-xs font-medium border
                                      ${p.status === "Active"
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
                                      ${p.status === "Active"
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

