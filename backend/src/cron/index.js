import { registerCron } from "./registerCron.js";
import { CRON } from "./schedules.js";
import attendanceCloseJob from "./jobs/attendance/attendanceClose.job.js";
import passReturnCheckJob from "./jobs/passes/passReturnCheck.job.js";
import visitAutoCompleteJob from "./jobs/visitor/visitAutoComplete.job.js";

/**
 * Initialize all cron jobs for the application.
 * This should be called once during server startup.
 */
export const initCron = () => {
  console.log("[CRON] Initializing Cron Infrastructure...");

  registerCron("Attendance Close", CRON.ATTENDANCE_CLOSE, attendanceCloseJob);
  registerCron("Pass Return Check", CRON.PASS_RETURN_CHECK, passReturnCheckJob);
  registerCron("Visit Auto Complete", CRON.VISIT_AUTO_COMPLETE, visitAutoCompleteJob);

  console.log("[CRON] All jobs registered successfully.");
};
