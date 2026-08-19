import swaggerJsdoc from "swagger-jsdoc";
import { swaggerConfig } from "./swagger.config.js";
import { SwaggerLoader } from "./swagger.loader.js";

/**
 * Enterprise Swagger Registry
 * Acts as the dynamic bundler, aggregating the Catalog and Domain Modules at runtime.
 */
class SwaggerRegistry {

  constructor() {
    this.spec = null;
  }

  /**
   * Initializes the swagger-jsdoc scanner to generate the unified API specification.
   * Auto-discovers any new modules added to docs/modules//v1/
   */
  buildSpecification() {
    if (this.spec) return this.spec;

    const baseDefinition = SwaggerLoader.loadBaseDefinition();

    const options = {
      swaggerDefinition: baseDefinition,
      apis: [
        swaggerConfig.catalogGlob, // Injects Shared Components
        swaggerConfig.modulesGlob  // Injects Decentralized Domains
      ],
    };

    try {
      this.spec = swaggerJsdoc(options);
      return this.spec;
    } catch (error) {
      console.error("❌ Swagger Registry Bundling Failed:", error.message);
      throw error;
    }
  }
}

export const swaggerRegistry = new SwaggerRegistry();
