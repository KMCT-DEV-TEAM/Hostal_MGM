import Announcement from "../../../modules/announcements/announcement.model.js";
import { triggerAnnouncementNotifications } from "../../../modules/announcements/announcement.service.js";

const announcementCheckJob = async () => {
    const now = new Date();

    // 1. Check for scheduled announcements that need to become active
    const scheduledAnnouncements = await Announcement.find({
        status: 'scheduled',
        scheduledAt: { $lte: now }
    });

    for (const announcement of scheduledAnnouncements) {
        announcement.status = 'active';
        announcement.isActive = true;
        await announcement.save();

        // Trigger notifications now that it's active
        triggerAnnouncementNotifications(announcement).catch(err => {
            console.error(`Failed to trigger notifications for announcement ${announcement._id}:`, err);
        });
    }

    // 2. Check for active announcements that need to expire
    const expiredAnnouncements = await Announcement.find({
        status: 'active',
        expiresAt: { $lte: now }
    });

    for (const announcement of expiredAnnouncements) {
        announcement.status = 'expired';
        announcement.isActive = false;
        await announcement.save();
    }
};

export default announcementCheckJob;
