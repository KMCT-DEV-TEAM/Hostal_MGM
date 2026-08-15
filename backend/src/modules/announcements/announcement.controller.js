import prisma from '../../config/db.js';

export const createAnnouncement = async (req, res) => {
  try {
    const data = await prisma.announcement.create({
      data: req.body,
    });
    res.status(201).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAnnouncements = async (req, res) => {
  try {
    const data = await prisma.announcement.findMany();
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.announcement.findUnique({
      where: { id: parseInt(id) },
    });
    if (!data) return res.status(404).json({ message: 'Not found' });
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.announcement.update({
      where: { id: parseInt(id) },
      data: req.body,
    });
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.announcement.delete({
      where: { id: parseInt(id) },
    });
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
