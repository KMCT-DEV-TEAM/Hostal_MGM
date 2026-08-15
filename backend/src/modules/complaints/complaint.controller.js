import prisma from '../../config/db.js';

export const createComplaint = async (req, res) => {
  try {
    const data = await prisma.complaint.create({
      data: req.body,
    });
    res.status(201).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getComplaints = async (req, res) => {
  try {
    const data = await prisma.complaint.findMany();
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.complaint.findUnique({
      where: { id: parseInt(id) },
    });
    if (!data) return res.status(404).json({ message: 'Not found' });
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.complaint.update({
      where: { id: parseInt(id) },
      data: req.body,
    });
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.complaint.delete({
      where: { id: parseInt(id) },
    });
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
