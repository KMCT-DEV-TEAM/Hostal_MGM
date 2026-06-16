import React, { useState } from 'react';
import {
    Square, Pencil, Trash2, Plus, Search,
    Download, Mail, Phone, MapPin,
    ChevronDown
} from 'lucide-react';

const INITIAL_ORGS = [
    { id: 1, name: 'Jacob Tarakan', email: 'anilkumar@gmail.com', phone: '9987898789', address: 'Abc street, Sarojini nagar', status: 'Active' },
    // ... add more as needed
];

export default function Organizationmanagement() {
    const [orgs] = useState(INITIAL_ORGS);

    return (
        <div className="w-full min-h-screen bg-[#F8FAFC] p-6 text-gray-700">
            {/* Header Section */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Organization</h1>
                    <p className="text-xs text-gray-400 mt-1">Manage all organizations</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm font-medium hover:bg-gray-50">
                        <Pencil className="w-4 h-4" /> Edit
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 bg-red-50 rounded-lg text-sm font-medium hover:bg-red-100">
                        <Trash2 className="w-4 h-4" /> Delete
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 flex items-center justify-between">
                <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white w-32">
                    <option>All</option>
                </select>

                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        <input className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64" placeholder="Search" />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#0A437A] text-white rounded-lg text-sm">
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
                            {['Name', 'Email', 'Phone', 'Address', 'Status', 'Action'].map(h => (
                                <th key={h} className="p-4">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                        {orgs.map((o) => (
                            <tr key={o.id} className="hover:bg-gray-50/40">
                                <td className="p-4"><Square className="w-5 h-5 text-gray-300" /></td>
                                <td className="p-4 flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-[#0A437A] text-white flex items-center justify-center font-bold text-xs">JT</div>
                                    {o.name}
                                </td>
                                <td className="p-4 text-gray-500"><Mail className="w-3 h-3 inline mr-2" />{o.email}</td>
                                <td className="p-4 text-gray-500"><Phone className="w-3 h-3 inline mr-2" />{o.phone}</td>
                                <td className="p-4 text-gray-600"><MapPin className="w-3 h-3 inline mr-2" />{o.address}</td>
                                <td className="p-4">
                                    <div className="relative w-fit mx-auto">
                                        <select
                                            value={o.status}
                                            onChange={(e) =>
                                                handleStatusChange(o.id, e.target.value)
                                            }
                                            className={`appearance-none rounded-full pl-4 pr-8 py-1 text-xs font-medium border
        ${o.status === "Active"
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
        ${o.status === "Active"
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