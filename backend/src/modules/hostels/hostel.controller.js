import prisma from '../../config/db.js';

export const createHostel = async (req, res) => {
  try {
    const data = await prisma.hostel.create({
      data: req.body,
    });
    res.status(201).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getHostels = async (req, res) => {
  try {
    const data = await prisma.hostel.findMany();
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getHostelById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.hostel.findUnique({
      where: { id: parseInt(id) },
    });
    if (!data) return res.status(404).json({ message: 'Not found' });
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateHostel = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.hostel.update({
      where: { id: parseInt(id) },
      data: req.body,
    });
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteHostel = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.hostel.delete({
      where: { id: parseInt(id) },
    });
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
