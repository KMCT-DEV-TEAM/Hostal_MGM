import Announcement from "./announcement.model.js";
import Hostel from "../hostels/hostel.model.js";
import Student from "../students/student.model.js";
import Parent from "../parents/parent.model.js";
import User from "../users/user.model.js";
import { orchestratorService } from "../notifications/services/orchestrator.service.js";

// Create Announcement
export const createAnnouncement = async (req, res, next) => {
  try {
    const { title, message, targetType, targetOrganizations, targetHostels } = req.body;
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

    const announcement = await Announcement.create({
      title,
      message,
      createdBy: user._id,
      creatorRole: user.role,
      targetType: actualTargetType,
      targetOrganizations: actualOrganizations,
      targetHostels: actualHostels,
    });

    // Determine Notification Target Audience
    let notificationTarget;
    if (actualTargetType === "general") {
       // Target all users basically
       notificationTarget = { type: 'USER', filter: {} };
    } else if (actualTargetType === "organization") {
       // Only to users in these organizations. 
       // We can send to Student and Parent by using Student resolver with org filter. Wait, Parent resolver also supports organizationId.
       notificationTarget = { type: 'USER', filter: { organizationId: { $in: actualOrganizations } } };
    } else if (actualTargetType === "hostel") {
       notificationTarget = { type: 'STUDENT', filter: { hostelId: { $in: actualHostels } } };
       // Wait, parents should also receive hostel announcements!
       // So we should just trigger twice or if UserResolver can handle it?
       // The resolvers take arrays? No, let's look at resolver code. `filter.organizationId` was used.
    }

    // It is easier to trigger multiple notifications if needed or a broad one.
    // Let's trigger for Students and Parents specifically if it's org/hostel.
    const notificationPromises = [];
    
    if (actualTargetType === "general") {
        // Send to everyone
        notificationPromises.push(orchestratorService.triggerNotification({
            eventName: 'NEW_ANNOUNCEMENT',
            target: { type: 'STUDENT', filter: {} },
            data: { title, message },
            sender: { id: user._id, model: 'User', snapshot: { name: user.name, role: user.role } }
        }));
        notificationPromises.push(orchestratorService.triggerNotification({
            eventName: 'NEW_ANNOUNCEMENT',
            target: { type: 'PARENT', filter: {} },
            data: { title, message },
            sender: { id: user._id, model: 'User', snapshot: { name: user.name, role: user.role } }
        }));
        notificationPromises.push(orchestratorService.triggerNotification({
            eventName: 'NEW_ANNOUNCEMENT',
            target: { type: 'USER', filter: {} }, // catches admins/wardens
            data: { title, message },
            sender: { id: user._id, model: 'User', snapshot: { name: user.name, role: user.role } }
        }));
    } else if (actualTargetType === "organization") {
        for (let orgId of actualOrganizations) {
            notificationPromises.push(orchestratorService.triggerNotification({
                eventName: 'NEW_ANNOUNCEMENT',
                target: { type: 'STUDENT', filter: { organizationId: orgId } },
                data: { title, message },
                sender: { id: user._id, model: 'User', snapshot: { name: user.name, role: user.role } }
            }));
            notificationPromises.push(orchestratorService.triggerNotification({
                eventName: 'NEW_ANNOUNCEMENT',
                target: { type: 'PARENT', filter: { organizationId: orgId } },
                data: { title, message },
                sender: { id: user._id, model: 'User', snapshot: { name: user.name, role: user.role } }
            }));
        }
    } else if (actualTargetType === "hostel") {
        for (let hId of actualHostels) {
            notificationPromises.push(orchestratorService.triggerNotification({
                eventName: 'NEW_ANNOUNCEMENT',
                target: { type: 'STUDENT', filter: { hostelId: hId } },
                data: { title, message },
                sender: { id: user._id, model: 'User', snapshot: { name: user.name, role: user.role } }
            }));
            notificationPromises.push(orchestratorService.triggerNotification({
                eventName: 'NEW_ANNOUNCEMENT',
                target: { type: 'PARENT', filter: { hostelId: hId } },
                data: { title, message },
                sender: { id: user._id, model: 'User', snapshot: { name: user.name, role: user.role } }
            }));
        }
    }

    Promise.allSettled(notificationPromises).catch(console.error);

    return res.status(201).json({
      success: true,
      message: "Announcement created successfully",
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
    let query = { isActive: true };

    if (user.role === "super_admin") {
      // Super admin sees all history
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
