import { AttendanceWindow } from "../../../modules/attendance/attendance.model.js";
import { closeAttendanceWindow } from "../../../modules/attendance/attendance.service.js";

/**
 * Job: Attendance Close
 * Purpose: Automatically close every attendance window that is still open.
 * Orchestrates the execution by delegating the actual closing logic 
 * to the shared closeAttendanceWindow workflow to avoid duplicating business logic.
 */
const attendanceCloseJob = async () => {
  // Find all attendance windows that are still open
  const openWindows = await AttendanceWindow.find({ status: "open" });

  if (openWindows.length === 0) {
    console.log("[CRON] Attendance Close - No open attendance windows found.");
    return;
  }

  console.log(`[CRON] Attendance Close - Found ${openWindows.length} open windows to close.`);

  let successCount = 0;
  let errorCount = 0;

  for (const window of openWindows) {
    try {
      // Execute the single source of truth for closing an attendance window.
      // We pass `startedBy` as the `completedBy` parameter so that the logic
      // accurately tracks who is responsible (the user who started the window)
      // or to satisfy database validation for required schema fields.
      await closeAttendanceWindow(window._id, window.startedBy);
      successCount++;
    } catch (err) {
      console.error(`[CRON] Attendance Close - Error closing window ${window._id}:`, err.message || err);
      errorCount++;
    }
  }

  console.log(`[CRON] Attendance Close - Summary: ${successCount} successful, ${errorCount} failed.`);
};

export default attendanceCloseJob;
