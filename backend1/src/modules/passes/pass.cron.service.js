import Pass from "./pass.model.js";

/**
 * Service specifically for pass-related cron operations.
 * Helps keep cron query logic separate from regular pass business logic.
 */
export const checkUnreturnedPassesDb = async () => {
  // Find approved passes where the student has left the hostel but not returned
  const unreturnedPasses = await Pass.find({
    status: "approved",
    "returnTracking.leftHostelAt": { $ne: null },
    "returnTracking.returnedAt": null
  });

  return unreturnedPasses;
};
