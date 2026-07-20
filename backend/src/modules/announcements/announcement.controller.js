import Announcement from "./announcement.model.js";
import Hostel from "../hostels/hostel.model.js";
import Student from "../students/student.model.js";
import Parent from "../parents/parent.model.js";
import User from "../users/user.model.js";
import { triggerAnnouncementNotifications } from "./announcement.service.js";

// Create Announcement
export const createAnnouncement = async (req, res, next) => {
  try {
    const { title, message, targetType, targetOrganizations, targetHostels, scheduledAt, expiresAt } = req.body;
    const user = req.user; 
    user._id = user.id || user._id; 

    if (!title || !message) {
      return res.status(400).json({ success: false, message: "Title and message are required" });
    }

    let actualTargetType = targetType;
    let actualOrganizations = [];
    let actualHostels = [];

    if (user.role === "super_admin") {
      if (!["general", "organization", "hostel"].includes(targetType)) {
        return res.status(400).json({ success: false, message: "Valid targetType is required for super admin" });
      }
      if (targetType === "organization") {
        actualOrganizations = targetOrganizations || [];
      } else if (targetType === "hostel") {
        actualHostels = targetHostels || [];
      }
    } else if (user.role === "admin") {
      actualTargetType = "organization";
      const dbUser = await User.findById(user._id);
      if (!dbUser || !dbUser.organization) {
         return res.status(400).json({ success: false, message: "Admin is not assigned to an organization" });
      }
      actualOrganizations = [dbUser.organization];
    } else if (user.role === "warden") {
      actualTargetType = "hostel";
      // Fetch hostels managed by this warden
      const hostels = await Hostel.find({ wardens: user._id });
      if (!hostels || hostels.length === 0) {
        return res.status(400).json({ success: false, message: "Warden is not assigned to any hostels" });
      }
      actualHostels = hostels.map(h => h._id);
    } else {
      return res.status(403).json({ success: false, message: "Unauthorized to create announcements" });
    }

    // Determine status based on scheduledAt
    let status = 'active';
    let isActive = true;
    if (scheduledAt && new Date(scheduledAt) > new Date()) {
      status = 'scheduled';
      isActive = false;
    }

    const announcement = await Announcement.create({
      title,
      message,
      createdBy: user._id,
      creatorRole: user.role,
      targetType: actualTargetType,
      targetOrganizations: actualOrganizations,
      targetHostels: actualHostels,
      scheduledAt: scheduledAt || null,
      expiresAt: expiresAt || null,
      status,
      isActive,
    });

    if (status === 'active') {
      // Trigger notifications asynchronously
      triggerAnnouncementNotifications(announcement).catch(console.error);
    }

    return res.status(201).json({
      success: true,
      message: status === 'scheduled' ? "Announcement scheduled successfully" : "Announcement created successfully",
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
};

// Get Announcements
export const getAnnouncements = async (req, res, next) => {
  try {
    const user = req.user;
    user._id = user.id || user._id;
    let query = { status: "active" };

    if (user.role === "super_admin") {
      // Super admin sees all history or based on status if needed
      query = {};
    } else if (user.role === "admin") {
      // Admins see general + their org
      const dbUser = await User.findById(user._id);
      query = {
        $or: [
          { targetType: "general" },
          { targetType: "organization", targetOrganizations: dbUser?.organization },
          { createdBy: user._id }
        ]
      };
    } else if (user.role === "warden") {
      // Wardens see general + their hostels
      const hostels = await Hostel.find({ wardens: user._id });
      const hostelIds = hostels.map(h => h._id);
      query = {
        $or: [
          { targetType: "general" },
          { targetType: "hostel", targetHostels: { $in: hostelIds } },
          { createdBy: user.id || user._id }
        ]
      };
    } else if (user.role === "student") {
       // Students see general + their org + their hostel
       const dbUser = await Student.findById(user._id);
       query = {
          $or: [
             { targetType: "general" },
             { targetType: "organization", targetOrganizations: dbUser?.organizationId },
             { targetType: "hostel", targetHostels: dbUser?.hostelId }
          ]
       };
    } else if (user.role === "parent") {
       // Parents need to see based on their student. 
       const dbUser = await Parent.findById(user._id);
       const parentStudent = await Student.findById(dbUser?.studentId);
       if (parentStudent) {
           query = {
              $or: [
                 { targetType: "general" },
                 { targetType: "organization", targetOrganizations: parentStudent.organizationId },
                 { targetType: "hostel", targetHostels: parentStudent.hostelId }
              ]
           };
       } else {
           query = { targetType: "general" };
       }
    }

    const announcements = await Announcement.find(query)
      .populate("createdBy", "name role")
      .populate("targetOrganizations", "name")
      .populate("targetHostels", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    next(error);
  }
};

// Update Announcement
export const updateAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, message, targetType, targetOrganizations, targetHostels, scheduledAt, expiresAt } = req.body;
    const user = req.user;
    user._id = user.id || user._id;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: "Announcement not found" });
    }

    // Check authorization: Super admin can edit anything. Others can only edit their own.
    if (user.role !== "super_admin" && announcement.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized to edit this announcement" });
    }

    let actualTargetType = targetType || announcement.targetType;
    let actualOrganizations = targetOrganizations || announcement.targetOrganizations;
    let actualHostels = targetHostels || announcement.targetHostels;

    if (user.role === "super_admin" && targetType) {
      if (!["general", "organization", "hostel"].includes(targetType)) {
        return res.status(400).json({ success: false, message: "Valid targetType is required" });
      }
      if (targetType === "general") {
         actualOrganizations = [];
         actualHostels = [];
      } else if (targetType === "organization") {
         actualHostels = [];
      } else if (targetType === "hostel") {
         actualOrganizations = [];
      }
    }

    // Update status if scheduledAt changed
    let status = announcement.status;
    let isActive = announcement.isActive;
    if (scheduledAt) {
      if (new Date(scheduledAt) > new Date()) {
        status = 'scheduled';
        isActive = false;
      } else {
        status = 'active';
        isActive = true;
      }
    }

    announcement.title = title || announcement.title;
    announcement.message = message || announcement.message;
    announcement.targetType = actualTargetType;
    announcement.targetOrganizations = actualOrganizations;
    announcement.targetHostels = actualHostels;
    announcement.scheduledAt = scheduledAt !== undefined ? scheduledAt : announcement.scheduledAt;
    announcement.expiresAt = expiresAt !== undefined ? expiresAt : announcement.expiresAt;
    announcement.status = status;
    announcement.isActive = isActive;

    await announcement.save();

    return res.status(200).json({
      success: true,
      message: "Announcement updated successfully",
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Announcement (Soft Delete)
export const deleteAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    user._id = user.id || user._id;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: "Announcement not found" });
    }

    if (user.role !== "super_admin" && announcement.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this announcement" });
    }

    announcement.status = 'deleted';
    announcement.isActive = false;
    await announcement.save();

    return res.status(200).json({
      success: true,
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
