import prisma from '../../config/db.js';

export const createPasswordRequest = async (req, res) => {
  try {
    const data = await prisma.passwordRequest.create({
      data: req.body,
    });
    res.status(201).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPasswordRequests = async (req, res) => {
  try {
    const data = await prisma.passwordRequest.findMany();
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPasswordRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.passwordRequest.findUnique({
      where: { id: parseInt(id) },
    });
    if (!data) return res.status(404).json({ message: 'Not found' });
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updatePasswordRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.passwordRequest.update({
      where: { id: parseInt(id) },
      data: req.body,
    });
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deletePasswordRequest = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.passwordRequest.delete({
      where: { id: parseInt(id) },
    });
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
