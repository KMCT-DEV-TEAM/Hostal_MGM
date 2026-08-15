import prisma from '../../config/db.js';

export const createActivityLog = async (req, res) => {
  try {
    const data = await prisma.activityLog.create({
      data: req.body,
    });
    res.status(201).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getActivityLogs = async (req, res) => {
  try {
    const data = await prisma.activityLog.findMany();
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getActivityLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.activityLog.findUnique({
      where: { id: parseInt(id) },
    });
    if (!data) return res.status(404).json({ message: 'Not found' });
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateActivityLog = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.activityLog.update({
      where: { id: parseInt(id) },
      data: req.body,
    });
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteActivityLog = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.activityLog.delete({
      where: { id: parseInt(id) },
    });
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
