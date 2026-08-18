import { templateService } from '../services/template.service.js';

export const registerAllTemplates = () => {
    // Registering a dummy test template for testing purposes
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

    console.log('[Notification System] All domain templates successfully registered.');
};
