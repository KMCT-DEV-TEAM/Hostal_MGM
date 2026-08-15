import { checkUnreturnedPassesDb } from "../../../modules/passes/pass.cron.service.js";

/**
 * Job: Pass Return Check
 * Purpose: Run periodically to find approved passes where the student left the hostel
 * but has not returned.
 */
const passReturnCheckJob = async () => {
  const unreturnedPasses = await checkUnreturnedPassesDb();

  console.log(`[CRON] Pass Return Check - Found ${unreturnedPasses.length} unreturned passes.`);

  if (unreturnedPasses.length > 0) {
    // TODO: Future Implementation
    // - Check if the pass is overdue (e.g., current time > pass.returnDate/time)
    // - Automatically update pass status (e.g., to "overdue")
    // - Dispatch notifications to Wardens and Parents
    // - Log the overdue events for record keeping
    
    // For now, we strictly follow the instruction to NOT change pass status, 
    // NOT mark completed, and NOT send notifications. We only prepare the infrastructure.
    console.log(`[CRON] Pass Return Check - TODO: Handle ${unreturnedPasses.length} unreturned passes automation.`);
  }
};

export default passReturnCheckJob;
