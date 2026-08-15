import { templateEngineService } from './template-engine.service.js';

/**
 * Builder Service
 * 
 * Takes raw templates and event data, and compiles them into the 
 * final dispatchable payload (e.g., injecting variables into title and message).
 */
class BuilderService {
    constructor() {}

    /**
     * Builds the final notification payload by running strings through the template engine.
     * @param {Object} rawTemplate - The template structure (e.g. { subject: 'Hi {{name}}', html: '...' })
     * @param {Object} data - The context variables to inject (e.g. { name: 'John' })
     * @returns {Object} The compiled payload
     */
    async buildPayload(rawTemplate, data) {
        if (!rawTemplate || typeof rawTemplate !== 'object') {
            return rawTemplate;
        }

        const builtPayload = {};
        
        // Traverse the template object and compile string values
        for (const [key, value] of Object.entries(rawTemplate)) {
            if (typeof value === 'string') {
                builtPayload[key] = templateEngineService.compile(value, data);
            } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                // Recursively compile nested objects just in case
                builtPayload[key] = await this.buildPayload(value, data);
            } else {
                // Copy arrays, numbers, booleans as-is
                builtPayload[key] = value;
            }
        }
        
        return builtPayload;
    }
}

export const builderService = new BuilderService();
