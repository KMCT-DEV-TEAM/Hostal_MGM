import { templateService } from './services/template.service.js';

// Import domain templates
import attendanceTemplates from '../attendance/attendance.notification.js';
import complaintTemplates from '../complaints/complaint.notification.js';
/**
 * Bootstraps the Template Registry by loading all domain-specific templates.
 */
export const registerAllTemplates = () => {
    templateService.registerTemplates(attendanceTemplates);
    templateService.registerTemplates(complaintTemplates);

    console.log('[Notification System] All domain templates successfully registered.');
};
