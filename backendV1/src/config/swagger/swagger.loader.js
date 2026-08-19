import fs from "fs";
import YAML from "yaml";
import { swaggerConfig } from "./swagger.config.js";

/**
 * Enterprise Swagger Loader
 * Responsible for File I/O and parsing the OpenAPI base shell.
 */
export class SwaggerLoader {
  
  /**
   * Reads and parses the root openapi.yaml shell
   * Injects the dynamic Server URL bindings.
   * @returns {Object} The parsed OpenAPI definition object
   */
  static loadBaseDefinition() {
    try {
      const fileContent = fs.readFileSync(swaggerConfig.shellPath, "utf8");
      const definition = YAML.parse(fileContent);

      // Dynamically inject the active server environment URL
      definition.servers = [
        {
          url: swaggerConfig.apiUrl,
          description: "Environment Server"
        }
      ];

      return definition;
    } catch (error) {
      console.error("❌ Failed to load Enterprise OpenAPI Shell:", error.message);
      throw error;
    }
  }
}
