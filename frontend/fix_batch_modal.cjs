const fs = require('fs');
let c = fs.readFileSync('src/features/dashboard/components/batch/BatchFormModal.jsx', 'utf8');
c = c.replace(/className=\{\\\x0Clex border border-gray-200 rounded-lg overflow-hidden focus-within:border-\[#0A437A\] \\\\\}/g, 'className="flex border border-gray-200 rounded-lg overflow-hidden focus-within:border-[#0A437A]"');
c = c.replace(/className=\{\\w-full px-3 py-2 outline-none text-xs uppercase \\\\\}/g, 'className="w-full px-3 py-2 outline-none text-xs uppercase"');
fs.writeFileSync('src/features/dashboard/components/batch/BatchFormModal.jsx', c);
