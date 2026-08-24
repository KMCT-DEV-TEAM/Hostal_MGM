import swaggerUi from "swagger-ui-express";
import { swaggerRegistry } from "./swagger.registry.js";
import { SwaggerValidator } from "./swagger.validator.js";

/**
 * Enterprise Swagger Setup Layer
 * Exposes the Express.js middleware binding function.
 */
export const setupSwagger = (app) => {
  // 1. Build the unified specification from the modular file system
  const spec = swaggerRegistry.buildSpecification();
  
  // 2. Validate the specification structure
  SwaggerValidator.validate(spec);

  // 3. Mount the Swagger UI to the Express Application
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(spec));
  
  console.log("📘 Enterprise OpenAPI Documentation mounted at /api-docs");
};
