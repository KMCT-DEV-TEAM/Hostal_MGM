import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { prisma } from '../../config/prisma.js';

export const createAnnouncement = asyncHandler(async (req, res) => {
  // TODO: Implement create
  return sendSuccess(res, 201, 'Announcement created successfully');
});

export const getAnnouncements = asyncHandler(async (req, res) => {
  // TODO: Implement getAll
  return sendSuccess(res, 200, 'Announcements retrieved successfully', []);
});

export const getAnnouncementById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // TODO: Implement getById
  return sendSuccess(res, 200, 'Announcement retrieved successfully', {});
});

export const updateAnnouncement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // TODO: Implement update
  return sendSuccess(res, 200, 'Announcement updated successfully', {});
});

export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // TODO: Implement delete
  return sendSuccess(res, 200, 'Announcement deleted successfully');
});
