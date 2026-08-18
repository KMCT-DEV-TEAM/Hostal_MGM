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
        if (!this.templates[eventName]) return [];
        const channels = new Set();
        for (const audienceTemplates of Object.values(this.templates[eventName])) {
            for (const channel of Object.keys(audienceTemplates)) {
                channels.add(channel);
            }
        }
        return Array.from(channels);
    }

    /**
     * Registers templates for a specific module/domain.
     * @param {Object} templatesObject - An object mapping EVENT_NAME to channels
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
     * @param {String} audience - 'STUDENT', 'PARENT', 'USER'
     * @param {String} channel - 'email', 'push', 'in-app'
     * @returns {Object} The raw template structure
     */
    getTemplate(eventName, audience, channel) {
        const eventTemplates = this.templates[eventName];
        
        if (!eventTemplates) {
            throw new Error(`No templates registered for event: ${eventName}`);
        }

        const audienceTemplates = eventTemplates[audience];
        if (!audienceTemplates) {
            return null;
        }

        return audienceTemplates[channel] || null;
    }
}

export const templateService = new TemplateService();
