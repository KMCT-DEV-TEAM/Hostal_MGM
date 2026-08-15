import prisma from '../../config/db.js';

export const createComplaintCategory = async (req, res) => {
  try {
    const data = await prisma.complaintCategory.create({
      data: req.body,
    });
    res.status(201).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getComplaintCategorys = async (req, res) => {
  try {
    const data = await prisma.complaintCategory.findMany();
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getComplaintCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.complaintCategory.findUnique({
      where: { id: parseInt(id) },
    });
    if (!data) return res.status(404).json({ message: 'Not found' });
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateComplaintCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.complaintCategory.update({
      where: { id: parseInt(id) },
      data: req.body,
    });
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteComplaintCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.complaintCategory.delete({
      where: { id: parseInt(id) },
    });
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
