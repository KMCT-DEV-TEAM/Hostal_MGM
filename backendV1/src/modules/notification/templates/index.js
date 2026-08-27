import { templateService } from '../services/template.service.js';
import complaintTemplates from '../../complaints/complaint.notification.js';

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

    // Register complaint domain templates
    templateService.registerTemplates(complaintTemplates);

    console.log('[Notification System] All domain templates successfully registered.');
};
