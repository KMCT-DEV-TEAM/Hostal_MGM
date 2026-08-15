import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modules = [
  'announcement',
  'batch',
  'complaint',
  'complaintCategory',
  'course',
  'department',
  'log',
  'organization',
  'otp',
  'hostel',
  'passwordRequest',
  'user'
];

const srcPath = path.join(__dirname, '..', 'src', 'modules');

const getControllerTemplate = (moduleName) => `import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { prisma } from '../../config/prisma.js';

export const create${capitalize(moduleName)} = asyncHandler(async (req, res) => {
  // TODO: Implement create
  return sendSuccess(res, 201, '${capitalize(moduleName)} created successfully');
});

export const get${capitalize(moduleName)}s = asyncHandler(async (req, res) => {
  // TODO: Implement getAll
  return sendSuccess(res, 200, '${capitalize(moduleName)}s retrieved successfully', []);
});

export const get${capitalize(moduleName)}ById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // TODO: Implement getById
  return sendSuccess(res, 200, '${capitalize(moduleName)} retrieved successfully', {});
});

export const update${capitalize(moduleName)} = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // TODO: Implement update
  return sendSuccess(res, 200, '${capitalize(moduleName)} updated successfully', {});
});

export const delete${capitalize(moduleName)} = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // TODO: Implement delete
  return sendSuccess(res, 200, '${capitalize(moduleName)} deleted successfully');
});
`;

const getRoutesTemplate = (moduleName) => `import express from 'express';
import { protect } from '../auth/auth.middleware.js';
import {
  create${capitalize(moduleName)},
  get${capitalize(moduleName)}s,
  get${capitalize(moduleName)}ById,
  update${capitalize(moduleName)},
  delete${capitalize(moduleName)}
} from './${moduleName}.controller.js';

const router = express.Router();

router.use(protect); // Apply protect middleware to all routes

router.route('/')
  .post(create${capitalize(moduleName)})
  .get(get${capitalize(moduleName)}s);

router.route('/:id')
  .get(get${capitalize(moduleName)}ById)
  .put(update${capitalize(moduleName)})
  .delete(delete${capitalize(moduleName)});

export default router;
`;

const getServiceTemplate = (moduleName) => `import { prisma } from '../../config/prisma.js';

// Add ${moduleName} specific business logic here
`;

const getValidationTemplate = (moduleName) => `// Add ${moduleName} specific validation schemas here (e.g. using Joi or Zod)
`;

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const generate = () => {
  if (!fs.existsSync(srcPath)) {
    fs.mkdirSync(srcPath, { recursive: true });
  }

  modules.forEach((moduleName) => {
    // We already have 'auth' which isn't in the list, but 'user' might have collision? No, auth is auth, user is user.
    const modulePath = path.join(srcPath, moduleName + 's'); // Plural folder names e.g. 'users', 'batches'
    const folderName = moduleName === 'batch' ? 'batches' : 
                       moduleName === 'complaintCategory' ? 'complaintCategories' : 
                       moduleName + 's';

    const actualModulePath = path.join(srcPath, folderName);

    if (!fs.existsSync(actualModulePath)) {
      fs.mkdirSync(actualModulePath, { recursive: true });
    }

    const controllerPath = path.join(actualModulePath, `${moduleName}.controller.js`);
    const routesPath = path.join(actualModulePath, `${moduleName}.routes.js`);
    const servicePath = path.join(actualModulePath, `${moduleName}.service.js`);
    const validationPath = path.join(actualModulePath, `${moduleName}.validation.js`);

    if (!fs.existsSync(controllerPath)) fs.writeFileSync(controllerPath, getControllerTemplate(moduleName));
    if (!fs.existsSync(routesPath)) fs.writeFileSync(routesPath, getRoutesTemplate(moduleName));
    if (!fs.existsSync(servicePath)) fs.writeFileSync(servicePath, getServiceTemplate(moduleName));
    if (!fs.existsSync(validationPath)) fs.writeFileSync(validationPath, getValidationTemplate(moduleName));

    console.log(`Generated ${folderName} module`);
  });
};

generate();
console.log('API Generation Complete!');
