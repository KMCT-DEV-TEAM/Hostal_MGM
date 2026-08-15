/**
 * Template Engine Service
 * 
 * The underlying engine that handles string interpolation.
 * Currently uses a simple regex replacement for {{variable}} syntax.
 * Isolated here so it can easily be swapped for Handlebars/Mustache in the future.
 */
class TemplateEngineService {
    constructor() {}

    /**
     * Compiles a string template with variables.
     * @param {String} templateString - e.g., "Hello {{name}}"
     * @param {Object} variables - e.g., { name: "John" }
     * @returns {String} The compiled string
     */
    compile(templateString, variables = {}) {
        if (typeof templateString !== 'string') {
            return templateString;
        }

        // Replaces {{ key }} or {{key}} with variables[key]
        return templateString.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
            // Return the variable if it exists, otherwise leave the {{key}} untouched
            return variables[key] !== undefined && variables[key] !== null 
                ? variables[key] 
                : match;
        });
    }
}

export const templateEngineService = new TemplateEngineService();
