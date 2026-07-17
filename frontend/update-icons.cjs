const fs = require('fs');
const path = require('path');

const baseDir = 'd:/KMCT/Projects/Hostal_MGM/frontend/src/features/dashboard/components';
const files = [
    'attendance/AttendanceRecordsTable.jsx',
    'attendance/AttendanceWindowsTable.jsx',
    'batch/BatchTable.jsx',
    'ComplaintCategory/ComplaintCategoryTable.jsx',
    'complaints/ComplaintsTable.jsx',
    'complaints/StudentComplaintsTable.jsx',
    'complaints/SuperAdminComplaintsTable.jsx',
    'complaints/WardenComplaintsTable.jsx',
    'course/CourseTable.jsx',
    'department/DepartmentTable.jsx',
    'Hostel/HostelTable.jsx',
    'maintenanceStaff/MaintenanceStaffTable.jsx',
    'organization/OrganizationTable.jsx',
    'parents/ParentsTable.jsx',
    'students/StudentsTable.jsx',
    'Warden/WardenTable.jsx'
];

function processFile(filePath) {
    const fullPath = path.join(baseDir, filePath);
    if (!fs.existsSync(fullPath)) return;
    let content = fs.readFileSync(fullPath, 'utf-8');

    // Find cardConfig fields
    const cardConfigRegex = /cardConfig\s*=\s*{[\s\S]*?fields:\s*\[([\s\S]*?)\]/g;
    let newContent = content.replace(cardConfigRegex, (match, fieldsStr) => {
        let newFields = fieldsStr;
        
        // Find all labels: label: t("phone") or label: "Phone"
        newFields = newFields.replace(/label:\s*(?:t\(['"]([^'"]+)['"]\)|['"]([^'"]+)['"])/g, (m, tKey, strKey) => {
            let key = (tKey || strKey).toLowerCase();
            if (key === 'phone') return 'icon: Phone';
            if (key === 'email') return 'icon: Mail';
            if (key === 'course') return 'icon: BookOpen';
            if (key === 'num_batches' || key === 'batch') return 'icon: Layers';
            if (key === 'organization' || key === 'department' || key === 'department_name' || key === 'organization_name') return 'icon: Building2';
            if (key === 'hostel_name' || key === 'hostel') return 'icon: Building';
            if (key === 'category' || key === 'complaint_type') return 'icon: Tag';
            if (key === 'priority') return 'icon: Flag';
            if (key === 'room') return 'icon: Grid';
            if (key === 'bed') return 'icon: Bed';
            if (key === 'blood_group') return 'icon: Droplet';
            if (key === 'guardian_name' || key === 'student_name' || key === 'warden_name' || key === 'assigned_to') return 'icon: User';
            if (key === 'guardian_phone' || key === 'guardian phone' || key === 'emergency phone' || key === 'emergency_contact') return 'icon: Phone';
            if (key === 'staff_type' || key === 'designation' || key === 'job_title' || key === 'role') return 'icon: Briefcase';
            if (key === 'gender') return 'icon: Users';
            if (key === 'address') return 'icon: MapPin';
            if (key === 'date') return 'icon: Calendar';
            if (key === 'time' || key === 'window_time') return 'icon: Clock';
            if (key === 'duration') return 'icon: Timer';
            if (key === 'type' || key === 'record_type') return 'icon: Type';
            if (key === 'description' || key === 'title') return 'icon: FileText';
            if (key === 'semester') return 'icon: BookOpen';
            
            // default fallback
            return 'icon: FileText';
        });
        
        return match.replace(fieldsStr, newFields);
    });

    if (newContent !== content) {
        // Collect icons to import
        const usedIcons = new Set();
        const iconRegex = /icon:\s*([A-Z][a-zA-Z]+)/g;
        let iconMatch;
        while ((iconMatch = iconRegex.exec(newContent)) !== null) {
            usedIcons.add(iconMatch[1]);
        }
        
        // Find existing lucide-react import
        const lucideRegex = /import\s+{([^}]+)}\s+from\s+['"]lucide-react['"]/g;
        let existingImport = lucideRegex.exec(newContent);
        
        if (existingImport) {
            let existingIcons = existingImport[1].split(',').map(i => i.trim()).filter(Boolean);
            let combinedIcons = new Set([...existingIcons, ...usedIcons]);
            
            newContent = newContent.replace(lucideRegex, 'import {\n    ' + Array.from(combinedIcons).join(',\n    ') + '\n} from "lucide-react"');
        }
        
        fs.writeFileSync(fullPath, newContent);
        console.log('Updated', filePath);
    }
}

files.forEach(processFile);
