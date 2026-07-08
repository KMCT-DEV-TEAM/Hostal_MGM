export const CRON = {
  // Run at 11:59 PM every day for testing or production. Can be configured via environment variable later.
  ATTENDANCE_CLOSE: "59 23 * * *",
  // Run every 15 minutes to check for unreturned passes
  PASS_RETURN_CHECK: "*/5 * * * *",
  // Run every 15 minutes to check for expired visitor visits
  VISIT_AUTO_COMPLETE: "*/15 * * * *"
};
