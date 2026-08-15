import prisma from '../../config/db.js';

export const createOrganization = async (req, res) => {
  try {
    const data = await prisma.organization.create({
      data: req.body,
    });
    res.status(201).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getOrganizations = async (req, res) => {
  try {
    const data = await prisma.organization.findMany();
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getOrganizationById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.organization.findUnique({
      where: { id: parseInt(id) },
    });
    if (!data) return res.status(404).json({ message: 'Not found' });
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.organization.update({
      where: { id: parseInt(id) },
      data: req.body,
    });
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.organization.delete({
      where: { id: parseInt(id) },
    });
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
