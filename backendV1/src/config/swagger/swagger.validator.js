/**
 * Enterprise Swagger Validator
 * Acts as the integration foundation for future CI/CD Governance and Spectral Linting.
 * Validates the runtime specification against the Shared Catalog Standards.
 */
export class SwaggerValidator {
  
  /**
   * Validates the generated specification object.
   * Currently performs basic structural checks. Future expansion will trigger Spectral.
   * @param {Object} spec - The compiled OpenAPI JSON object
   */
  static validate(spec) {
    if (!spec || typeof spec !== 'object') {
      throw new Error("❌ Validation Error: Swagger specification is invalid or null.");
    }

    if (!spec.openapi || !spec.openapi.startsWith("3.")) {
      console.warn("⚠️ Governance Warning: Specification is not using OpenAPI 3.x format.");
    }

    if (!spec.paths || Object.keys(spec.paths).length === 0) {
      console.warn("⚠️ Governance Warning: No domain paths were discovered by the bundler.");
    }

    // Success
    return true;
  }
}
