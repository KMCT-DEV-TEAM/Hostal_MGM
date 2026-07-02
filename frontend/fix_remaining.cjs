const fs = require('fs');

let f1 = 'src/features/dashboard/components/batch/BatchDetailView.jsx';
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace(/subtitle=\{\\\\\s*\\s*Students\\\}/g, 'subtitle="Students"');
fs.writeFileSync(f1, c1);

let f2 = 'src/features/dashboard/components/batch/BatchFormModal.jsx';
let c2 = fs.readFileSync(f2, 'utf8');
c2 = c2.replace(/const deptCode = selectedDept \? \\\\-\\\\ : '';/g, 'const deptCode = selectedDept ? \\-\ : \'\';');
fs.writeFileSync(f2, c2);

let f3 = 'src/features/dashboard/components/course/CourseDetailView.jsx';
let c3 = fs.readFileSync(f3, 'utf8');
c3 = c3.replace(/subtitle=\{\\   \ Courses\\\}/g, 'subtitle="Courses"');
fs.writeFileSync(f3, c3);

let f4 = 'src/features/dashboard/components/course/CourseFormModal.jsx';
let c4 = fs.readFileSync(f4, 'utf8');
c4 = c4.replace(/className=\{\\\x0Clex-1 w-full px-3 py-2 bg-gray-50\/50 border border-gray-200 text-xs focus:outline-none focus:border-\[#0A437A\] \\ \\\\\}/g, 'className="flex-1 w-full px-3 py-2 bg-gray-50/50 border border-gray-200 text-xs focus:outline-none focus:border-[#0A437A]"');
fs.writeFileSync(f4, c4);

let f5 = 'src/features/dashboard/components/department/DepartmentDetailView.jsx';
let c5 = fs.readFileSync(f5, 'utf8');
c5 = c5.replace(/subtitle=\{\\   \ Departments\\\}/g, 'subtitle="Departments"');
fs.writeFileSync(f5, c5);
