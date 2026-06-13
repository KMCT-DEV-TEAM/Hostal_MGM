import React, { useState } from "react";
import {
    Search, ChevronDown, Pencil, Trash2,
    Mail, Phone, Download, ArrowLeft, Eye, EyeOff,
} from "lucide-react";

const AddNewAdmin = ({ onBack }) => {
    const [status, setStatus] = useState("Active");
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState("");

    const generatePassword = () => {
        const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
        setPassword(Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join(""));
    };

    return (
        <div className="p-3 sm:p-4 lg:p-6 bg-[#F4F6F9] min-h-screen">
            {/* Back link */}
            <button
                onClick={onBack}
                className="flex items-center gap-1 text-sm text-[#0A467F] mb-4 hover:underline"
            >
                <ArrowLeft size={14} />
                Back to Admin
            </button>

            <div className="mb-6">
                <h1 className="text-[22px] font-semibold text-[#111827]">Add New Admin</h1>
                <p className="text-sm text-[#777777]">Fill in the details to manually create a new Admin.</p>
            </div>

            <div className="flex flex-col gap-5 max-w-2xl">

                {/* Basic Info */}
                <div className="bg-white rounded-xl border border-[#E3E3E3] p-5">
                    <h2 className="text-sm font-semibold text-[#0A467F] mb-1">Basic Info</h2>
                    <p className="text-xs text-[#777777] mb-4">Basic contact information of the Admin</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm text-[#111827] mb-1">
                                First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter your first name"
                                className="w-full h-10 px-3 border border-[#E3E3E3] rounded-lg outline-none text-sm focus:border-[#0A467F]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-[#111827] mb-1">
                                Last Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter your last name"
                                className="w-full h-10 px-3 border border-[#E3E3E3] rounded-lg outline-none text-sm focus:border-[#0A467F]"
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm text-[#111827] mb-1">
                            Phone Number <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-1 px-3 border border-[#E3E3E3] rounded-lg text-sm text-[#777777] bg-white">
                                🇮🇳 +91
                                <ChevronDown size={14} className="ml-1" />
                            </div>
                            <input
                                type="tel"
                                className="flex-1 h-10 px-3 border border-[#E3E3E3] rounded-lg outline-none text-sm focus:border-[#0A467F]"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-[#111827] mb-1">
                            Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="w-full h-10 px-3 border border-[#E3E3E3] rounded-lg outline-none text-sm focus:border-[#0A467F]"
                        />
                    </div>
                </div>

                {/* Organization Assignment */}
                <div className="bg-white rounded-xl border border-[#E3E3E3] p-5">
                    <h2 className="text-sm font-semibold text-[#0A467F] mb-1">Organization Assignment</h2>
                    <p className="text-xs text-[#777777] mb-4">Assign an organization to this administrator</p>

                    <div className="mb-4">
                        <label className="block text-sm text-[#111827] mb-1">
                            Assign Organization <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <select className="w-full h-10 px-3 pr-10 border border-[#E3E3E3] rounded-lg outline-none text-sm appearance-none bg-white text-[#777777] focus:border-[#0A467F]">
                                <option value="">Select an Organization</option>
                                <option>KMCT Engineering</option>
                                <option>MES College</option>
                                <option>Calicut University</option>
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777777] pointer-events-none" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-[#111827] mb-2">
                            Account Status <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-3">
                            {["Active", "Inactive"].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStatus(s)}
                                    className={`px-5 py-1.5 rounded-full text-sm border transition-colors ${status === s
                                            ? "bg-[#0A467F] text-white border-[#0A467F]"
                                            : "bg-white text-[#777777] border-[#E3E3E3]"
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Account Credentials */}
                <div className="bg-white rounded-xl border border-[#E3E3E3] p-5">
                    <h2 className="text-sm font-semibold text-[#0A467F] mb-1">Account Credentials</h2>
                    <p className="text-xs text-[#777777] mb-4">Set the login credentials for this administrator</p>

                    <div className="mb-4">
                        <label className="block text-sm text-[#111827] mb-1">
                            Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            placeholder="Enter email"
                            className="w-full h-10 px-3 border border-[#E3E3E3] rounded-lg outline-none text-sm focus:border-[#0A467F]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-[#111827] mb-1">
                            Temporary Password <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Minimum 12 characters"
                                    className="w-full h-10 px-3 pr-10 border border-[#E3E3E3] rounded-lg outline-none text-sm focus:border-[#0A467F]"
                                />
                                <button
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777777]"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <button
                                onClick={generatePassword}
                                className="flex items-center gap-2 px-4 h-10 border border-[#E3E3E3] rounded-lg text-sm text-[#555] hover:bg-gray-50 whitespace-nowrap"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
                                Auto Generate
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6">
                    <label className="flex items-start gap-2 text-sm text-[#555] cursor-pointer">
                        <input type="checkbox" className="mt-0.5" defaultChecked />
                        <span>
                            Force Password change on first login
                            <br />
                            <span className="text-xs text-[#777777]">
                                Enhance security by prompting the user to reset their account credential upon activation.
                            </span>
                        </span>
                    </label>

                    <div className="flex gap-3 self-end sm:self-auto">
                        <button
                            onClick={onBack}
                            className="px-6 h-10 border border-[#E3E3E3] rounded-lg text-sm text-[#555] hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button className="px-6 h-10 bg-[#0A467F] text-white rounded-lg text-sm hover:bg-[#083a6b]">
                            Save
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

function Administrator() {

    const [view, setView] = useState("list"); // "list" | "add"
    const [admins, setAdmins] = useState(
        Array(10).fill().map(() => ({
            name: "Anil Kumar",
            email: "anilkumar@gmail.com",
            phone: "9987898789",
            organization: "KMCT Engineering",
            status: "Active",
        }))
    );
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 5;

    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentAdmins = admins.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(admins.length / rowsPerPage);

    const handleStatusChange = (index, newStatus) => {
        const updated = [...admins];
        updated[indexOfFirstRow + index] = { ...updated[indexOfFirstRow + index], status: newStatus };
        setAdmins(updated);
    };

    if (view === "add") {
        return <AddNewAdmin onBack={() => setView("list")} />;
    }

    const getPages = () => {
        const pages = [];
        if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); return pages; }
        pages.push(1);
        if (currentPage > 3) pages.push("...");
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
        if (currentPage < totalPages - 2) pages.push("...");
        pages.push(totalPages);
        return pages;
    };

    return (
        <div className="p-3 sm:p-4 lg:p-6 bg-[#F4F6F9] min-h-screen">
            <div className="mb-6">
                <h1 className="text-[22px] font-semibold text-[#111827]">Admin</h1>
                <p className="text-sm text-[#777777]">Manage all registered hostel administrators</p>
            </div>

            <div className="bg-white rounded-xl border border-[#E3E3E3]">
                {/* Toolbar */}
                <div className="p-5 flex flex-col md:flex-row justify-between gap-4">
                    <button className="w-[120px] h-11 border border-[#E3E3E3] rounded-lg flex items-center justify-between px-4">
                        All <ChevronDown size={16} />
                    </button>
                    <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                        <div className="relative">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#777777]" />
                            <input placeholder="Search" className="w-full sm:w-[280px] h-11 pl-11 border border-[#E3E3E3] rounded-lg outline-none" />
                        </div>
                        <button className="px-5 h-11 border border-[#E3E3E3] rounded-lg text-[#777777] flex items-center gap-2">
                            <Download size={16} strokeWidth={1.8} /> Export
                        </button>
                        <button
                            onClick={() => setView("add")}
                            className="px-5 h-11 bg-[#0A467F] border border-[#E3E3E3] text-white rounded-lg"
                        >
                            + Add New
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-[900px] lg:min-w-full w-full">
                        <thead className="bg-[#F6F6F6]">
                            <tr className="text-left text-sm text-[#777777]">
                                <th className="p-4"><input type="checkbox" /></th>
                                <th className="py-3">Name</th>
                                <th className="hidden md:table-cell py-3">Email</th>
                                <th className="hidden lg:table-cell py-3">Phone</th>
                                <th className="hidden md:table-cell py-3">Organization</th>
                                <th className="py-3">Status</th>
                                <th className="text-center py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentAdmins.map((admin, index) => (
                                <tr key={index} className="border-t border-[#F1F1F1] h-[37px] hover:bg-blue-50/50">
                                    <td className="p-4"><input type="checkbox" /></td>
                                    <td>
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#0A467F] text-white flex items-center justify-center text-xs flex-shrink-0">AK</div>
                                            <div>
                                                <p className="text-[#777777]">{admin.name}</p>
                                                <p className="text-xs text-[#999] md:hidden">{admin.email}</p>
                                                <p className="text-xs text-[#999] lg:hidden">{admin.phone}</p>
                                                <p className="text-xs text-[#999] md:hidden">{admin.organization}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="hidden md:table-cell">
                                        <div className="flex items-center gap-2 text-[#777777]"><Mail size={14} /><span>{admin.email}</span></div>
                                    </td>
                                    <td className="hidden lg:table-cell">
                                        <div className="flex items-center gap-2 text-[#777777]"><Phone size={14} />{admin.phone}</div>
                                    </td>
                                    <td>
                                        <div className="relative inline-block">
                                            <select className="appearance-none border border-[#E3E3E3] rounded-[17px] px-4 pr-10 py-2 text-sm bg-white outline-none">
                                                <option>{admin.organization}</option>
                                            </select>
                                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777777] pointer-events-none" />
                                        </div>
                                    </td>
                                    <td>
                                        <div className="relative inline-block">
                                            <select
                                                value={admin.status}
                                                onChange={(e) => handleStatusChange(index, e.target.value)}
                                                className={`appearance-none px-5 pr-8 py-2 rounded-full text-sm outline-none cursor-pointer ${admin.status === "Active" ? "bg-[#0F6E5612] text-[#0F6E56]" : "bg-[#DE454521] text-[#EF4444]"
                                                    }`}
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                            <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${admin.status === "Active" ? "text-[#0F6E56]" : "text-[#EF4444]"}`} />
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center justify-center gap-4 text-[#1565B3]">
                                            <Trash2 size={18} />
                                            <Pencil size={18} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-5 py-3 border-t border-[#F1F1F1]">
                    <span className="text-sm text-[#000000]">
                        Showing {Math.min(rowsPerPage, admins.length - indexOfFirstRow)} of {admins.length}
                    </span>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-md border border-[#E3E3E3] text-[#777777] disabled:opacity-40">‹</button>
                        {getPages().map((p, i) =>
                            p === "..." ? (
                                <span key={`e-${i}`} className="w-8 h-8 flex items-center justify-center text-[#777777] text-sm">…</span>
                            ) : (
                                <button key={p} onClick={() => setCurrentPage(p)} className={`w-8 h-8 flex items-center justify-center rounded-md text-sm border ${currentPage === p ? "bg-[#0A467F] text-white border-[#0A467F]" : "border-[#E3E3E3] text-[#333]"}`}>{p}</button>
                            )
                        )}
                        <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center rounded-md border border-[#E3E3E3] text-[#777777] disabled:opacity-40">›</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Administrator