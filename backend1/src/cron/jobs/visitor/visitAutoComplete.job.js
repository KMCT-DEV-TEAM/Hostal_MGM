import { autoCompleteExpiredVisits } from "../../../modules/visitor/visitor.service.js";

/**
 * Job: Visit Auto Complete
 * Purpose: Run periodically to find expired visits (where expected exit time has passed)
 * and automatically mark them as Completed.
 */
const visitAutoCompleteJob = async () => {

  try {
    const result = await autoCompleteExpiredVisits();
  } catch (error) {
    console.error(`[CRON] Visit Auto Complete - Execution failed entirely:`, error);
  }
};

export default visitAutoCompleteJob;
