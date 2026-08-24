import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Enterprise Swagger Configuration
 * Single Source of Truth for documentation paths and environment bindings.
 */
export const swaggerConfig = {
  // Base server port resolution
  port: process.env.PORT || 5000,

  // Environment base URL
  get apiUrl() {
    return `http://localhost:${this.port}/api`;
  },

  // Absolute path to the OpenAPI base shell
  shellPath: path.join(__dirname, "../../docs/openapi.yaml"),

  // Glob pattern to auto-discover Shared Catalog schemas
  // Uses forward slashes exclusively to ensure swagger-jsdoc works on Windows
  catalogGlob: path.join(__dirname, "../../docs/catalog/*.yaml").replace(/\\/g, '/'),

  // Glob pattern to auto-discover all future Domain Modules
  // Ensures zero-touch discovery when new folders (e.g. docs/modules/furniture/) are added
  modulesGlob: path.join(__dirname, "../../docs/modules/*/*.yaml").replace(/\\/g, '/'),
};
