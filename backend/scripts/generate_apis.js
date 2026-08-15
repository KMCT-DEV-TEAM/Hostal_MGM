import fs from 'fs';
import path from 'path';

const models = [
  'Organization',
  'Course',
  'Department',
  'Batch',
  'Hostel',
  'Announcement',
  'Complaint',
  'ComplaintCategory',
  'ActivityLog',
  'Otp',
  'PasswordRequest'
];

const modulesDir = path.join(process.cwd(), 'src', 'modules');

if (!fs.existsSync(modulesDir)) fs.mkdirSync(modulesDir, { recursive: true });

models.forEach((model) => {
  const modelLower = model.charAt(0).toLowerCase() + model.slice(1);
  const moduleName = modelLower + 's'; // simple pluralization for folder name, adjust if needed
  
  // Custom folder names to match backend1 exactly if possible, but let's just use plural names
  const folderName = model === 'ActivityLog' ? 'logs' 
                   : model === 'PasswordRequest' ? 'passwordRequests'
                   : model === 'ComplaintCategory' ? 'complaintCategories'
                   : moduleName;

  const folderPath = path.join(modulesDir, folderName);
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

  const controllerCode = `import prisma from '../../config/db.js';

export const create${model} = async (req, res) => {
  try {
    const data = await prisma.${modelLower}.create({
      data: req.body,
    });
    res.status(201).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const get${model}s = async (req, res) => {
  try {
    const data = await prisma.${modelLower}.findMany();
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const get${model}ById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.${modelLower}.findUnique({
      where: { id: parseInt(id) },
    });
    if (!data) return res.status(404).json({ message: 'Not found' });
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const update${model} = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.${modelLower}.update({
      where: { id: parseInt(id) },
      data: req.body,
    });
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const delete${model} = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.${modelLower}.delete({
      where: { id: parseInt(id) },
    });
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
`;

  const routeCode = `import express from 'express';
import {
  create${model},
  get${model}s,
  get${model}ById,
  update${model},
  delete${model},
} from './${modelLower}.controller.js';
import { protect } from '../auth/auth.middleware.js';

const router = express.Router();

router.route('/')
  .post(protect, create${model})
  .get(protect, get${model}s);

router.route('/:id')
  .get(protect, get${model}ById)
  .put(protect, update${model})
  .delete(protect, delete${model});

export default router;
`;

  fs.writeFileSync(path.join(folderPath, `${modelLower}.controller.js`), controllerCode);
  fs.writeFileSync(path.join(folderPath, `${modelLower}.routes.js`), routeCode);
});

console.log('Modules created successfully.');
