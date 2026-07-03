/**
 * Template Service (Registry)
 * 
 * Acts as a central registry for all notification templates.
 * It has no knowledge of domain logic (Leaves, Complaints, etc.),
 * it simply stores templates provided to it and serves them upon request.
 */
class TemplateService {
    constructor() {
        this.templates = {};
    }

    /**
     * Checks if a domain event is registered in the templates registry.
     * @param {String} eventName 
     * @returns {Boolean}
     */
    hasEvent(eventName) {
        return !!this.templates[eventName];
    }

    /**
     * Retrieves all channels explicitly registered for an event.
     * @param {String} eventName 
     * @returns {Array<String>}
     */
    getAllowedChannels(eventName) {
        return this.templates[eventName] ? Object.keys(this.templates[eventName]) : [];
    }

    /**
     * Registers templates for a specific module/domain.
     * @param {Object} templatesObject - An object mapping EVENT_NAME to channels (e.g. { LEAVE_APPROVED: { email: {...}, push: {...} } })
     */
    registerTemplates(templatesObject) {
        if (typeof templatesObject !== 'object' || templatesObject === null) {
            throw new Error('Templates must be a valid object mapping.');
        }

        for (const [eventName, channelTemplates] of Object.entries(templatesObject)) {
            if (this.templates[eventName]) {
                console.warn(`[TemplateService] Warning: Overwriting existing templates for event '${eventName}'`);
            }
            this.templates[eventName] = channelTemplates;
        }
    }

    /**
     * Fetches the raw template structure for a given event and channel.
     * @param {String} eventName - e.g., 'LEAVE_APPROVED'
     * @param {String} channel - 'email', 'push', 'in-app'
     * @returns {Object} The raw template structure
     */
    async getTemplate(eventName, channel) {
        const eventTemplates = this.templates[eventName];
        
        if (!eventTemplates) {
            throw new Error(`No templates registered for event: ${eventName}`);
        }

        const channelTemplate = eventTemplates[channel];
        
        if (!channelTemplate) {
            throw new Error(`No template defined for event '${eventName}' on channel '${channel}'`);
        }

        return channelTemplate;
    }
}

export const templateService = new TemplateService();
