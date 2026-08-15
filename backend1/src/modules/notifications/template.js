import { templateService } from './services/template.service.js';

// Import domain templates
import attendanceTemplates from '../attendance/attendance.notification.js';
import complaintTemplates from '../complaints/complaint.notification.js';
import passTemplates from '../passes/pass.notification.js';
import visitTimeline from '../visitor/visitor.notification.js';
import studentHostelTemplates from '../student-hostels/studentHostel.notification.js';
import announcementTemplates from '../announcements/announcement.notification.js';
import mentorAssignmentTemplates from '../mentor-assignment/mentorAssignment.notification.js';
import studentTemplates from '../students/student.notification.js';
import furnitureTemplates from '../furnitures/furniture.notification.js';

/**
 * Bootstraps the Template Registry by loading all domain-specific templates.
 */
export const registerAllTemplates = () => {
    templateService.registerTemplates(attendanceTemplates);
    templateService.registerTemplates(complaintTemplates);
    templateService.registerTemplates(passTemplates);
    templateService.registerTemplates(visitTimeline);
    templateService.registerTemplates(studentHostelTemplates);
    templateService.registerTemplates(announcementTemplates);
    templateService.registerTemplates(mentorAssignmentTemplates);
    templateService.registerTemplates(studentTemplates);
    templateService.registerTemplates(furnitureTemplates);

    console.log('[Notification System] All domain templates successfully registered.');
};
