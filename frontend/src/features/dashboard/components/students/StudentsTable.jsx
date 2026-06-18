import React from 'react';
import { Square, CheckSquare, Pencil, Trash2 } from 'lucide-react';

export default function StudentsTable({ students, selectedIds, onSelectAll, onSelectRow, onEditClick }) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
                <thead>
                    <tr className=" text-[#222222] text-sm font-semibold border-b border-gray-50">
                        <th className="p-4 text-gray-300">
                            <button onClick={onSelectAll} className="focus:outline-none">
                                {selectedIds.length === students.length && students.length > 0 ? 
                                    <CheckSquare className=" h-5 w-5 text-[#0A437A]" /> : 
                                    <Square className="h-5 w-5 text-gray-300" />
                                }
                            </button>
                        </th>
                        {['Admission No', 'Name', 'Course', 'Department', 'Org Id', 'Hostel', 'Status', 'Action'].map(h => <th key={h} className="p-4">{h}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                    {students.map(s => (
                        <tr key={s.id} className="hover:bg-gray-50 text-[#777777]">
                            <td className="p-4">
                                <button onClick={() => onSelectRow(s.id)} className="focus:outline-none">
                                    {selectedIds.includes(s.id) ? 
                                        <CheckSquare className=" h-5 w-5 text-[#0A437A]" /> : 
                                        <Square className="h-5 w-5 text-gray-300" />
                                    }
                                </button>
                            </td>
                            <td className="p-4">{s.admissionNo}</td>
                            <td className="p-4 flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-[#0A437A] text-white flex items-center justify-center text-[10px]">
                                    {s.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                </div>
                                {s.name}
                            </td>
                            <td className="p-4">{s.course}</td>
                            <td className="p-4">{s.dept}</td>
                            <td className="p-4">{s.orgId}</td>
                            <td className="p-4"><select className="border-none bg-transparent outline-none"><option>{s.hostel}</option></select></td>
                            <td className="p-4">
                                <span className={`px-3 py-1 rounded-full text-xs ${s.status === 'Active' ? 'bg-green-50 text-success' : 'bg-red-50 text-danger'}`}>
                                    {s.status}
                                </span>
                            </td>
                            <td className="p-4 flex gap-3 text-secondary">
                                <Trash2 className="w-4 h-4 cursor-pointer hover:text-danger transition-colors" />
                                <Pencil
                                    className="w-4 h-4 cursor-pointer text-secondary hover:text-primary transition-colors"
                                    onClick={() => onEditClick(s)}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
