import prisma from '../../config/db.js';

export const createBatch = async (req, res) => {
  try {
    const data = await prisma.batch.create({
      data: req.body,
    });
    res.status(201).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getBatchs = async (req, res) => {
  try {
    const data = await prisma.batch.findMany();
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getBatchById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.batch.findUnique({
      where: { id: parseInt(id) },
    });
    if (!data) return res.status(404).json({ message: 'Not found' });
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.batch.update({
      where: { id: parseInt(id) },
      data: req.body,
    });
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.batch.delete({
      where: { id: parseInt(id) },
    });
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
