import prisma from '../../config/db.js';

export const createOtp = async (req, res) => {
  try {
    const data = await prisma.otp.create({
      data: req.body,
    });
    res.status(201).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getOtps = async (req, res) => {
  try {
    const data = await prisma.otp.findMany();
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getOtpById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.otp.findUnique({
      where: { id: parseInt(id) },
    });
    if (!data) return res.status(404).json({ message: 'Not found' });
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.otp.update({
      where: { id: parseInt(id) },
      data: req.body,
    });
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteOtp = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.otp.delete({
      where: { id: parseInt(id) },
    });
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
