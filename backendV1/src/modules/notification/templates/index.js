import { templateService } from '../services/template.service.js';
import announcementTemplates from '../../announcements/announcement.notification.js';
import attendanceTemplates from '../../attendance/attendance.notification.js';
import complaintTemplates from '../../complaints/complaint.notification.js';
import furnitureTemplates from '../../furnitures/furniture.notification.js';
import mentorAssignmentTemplates from '../../mentor-assignment/mentorAssignment.notification.js';
import passTemplates from '../../passes/pass.notification.js';
import studentHostelTemplates from '../../student-hostel/studentHostel.notification.js';
import studentTemplates from '../../students/student.notification.js';
import visitorTemplates from '../../visitor/visitor.notification.js';

export const registerAllTemplates = () => {
    // Registering dummy test template
    templateService.registerTemplates({
        'TEST_EVENT': {
            'USER': {
                'in-app': { title: 'Test Notification', message: 'This is a test message.' },
                'push': { title: 'Test Push', message: 'This is a test push.' }
            },
            'STUDENT': {
                'in-app': { title: 'Test Student', message: 'Student test message.' }
            }
        }
    });

    // Register all domain templates
    templateService.registerTemplates(announcementTemplates);
    templateService.registerTemplates(attendanceTemplates);
    templateService.registerTemplates(complaintTemplates);
    templateService.registerTemplates(furnitureTemplates);
    templateService.registerTemplates(mentorAssignmentTemplates);
    templateService.registerTemplates(passTemplates);
    templateService.registerTemplates(studentHostelTemplates);
    templateService.registerTemplates(studentTemplates);
    templateService.registerTemplates(visitorTemplates);

    console.log('[Notification System] All domain templates successfully registered.');
};
