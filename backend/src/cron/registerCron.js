import cron from "node-cron";

/**
 * Reusable helper to register cron jobs with built-in logging and error handling.
 * 
 * @param {string} jobName - A human-readable name for the job (e.g., 'Attendance Close')
 * @param {string} schedule - Cron expression string
 * @param {Function} handler - The async function containing the job execution logic
 */
export const registerCron = (jobName, schedule, handler) => {
  cron.schedule(schedule, async () => {
    console.log(`[CRON] ${jobName} - Started`);
    const startTime = process.hrtime();
    
    try {
      await handler();
      const endTime = process.hrtime(startTime);
      const durationInSeconds = (endTime[0] + endTime[1] / 1e9).toFixed(3);
      console.log(`[CRON] ${jobName} - Completed`);
      console.log(`[CRON] ${jobName} - Execution Time: ${durationInSeconds} sec`);
    } catch (error) {
      const endTime = process.hrtime(startTime);
      const durationInSeconds = (endTime[0] + endTime[1] / 1e9).toFixed(3);
      console.error(`[CRON] ${jobName} - Failed`);
      console.error(`[CRON] ${jobName} - Error:`, error.message || error);
      console.error(`[CRON] ${jobName} - Execution Time before failure: ${durationInSeconds} sec`);
    }
  });
};
