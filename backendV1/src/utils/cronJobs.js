import cron from "node-cron";
import { prisma } from "../config/prisma.js";
import { sendMail } from "./mailer.js";

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Build an HTML email table from audit log records
// ─────────────────────────────────────────────────────────────────────────────
const buildLogEmailHtml = (logs, periodLabel) => {
  const rows = logs
    .map(
      (log, i) => `
      <tr style="background:${i % 2 === 0 ? "#f9f9f9" : "#ffffff"}">
        <td style="padding:8px;border:1px solid #ddd;">${i + 1}</td>
        <td style="padding:8px;border:1px solid #ddd;">${log.priority}</td>
        <td style="padding:8px;border:1px solid #ddd;">${log.action}</td>
        <td style="padding:8px;border:1px solid #ddd;">${log.module}</td>
        <td style="padding:8px;border:1px solid #ddd;">${log.ipAddress || "N/A"}</td>
        <td style="padding:8px;border:1px solid #ddd;">${new Date(log.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
      </tr>`
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;max-width:900px;margin:auto;">
      <h2 style="color:#1a237e;">Hostal MGM — Audit Log Report</h2>
      <p style="color:#555;">Period: <strong>${periodLabel}</strong></p>
      <p style="color:#555;">Total records (MEDIUM + HIGH priority): <strong>${logs.length}</strong></p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#1a237e;color:#fff;">
            <th style="padding:10px;border:1px solid #ddd;">#</th>
            <th style="padding:10px;border:1px solid #ddd;">Priority</th>
            <th style="padding:10px;border:1px solid #ddd;">Action</th>
            <th style="padding:10px;border:1px solid #ddd;">Module</th>
            <th style="padding:10px;border:1px solid #ddd;">IP Address</th>
            <th style="padding:10px;border:1px solid #ddd;">Date &amp; Time (IST)</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="color:#888;font-size:12px;margin-top:20px;">
        This is an automated report. These logs will be deleted from the system in 1 month.
      </p>
    </div>`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Build a CSV string from audit log records
// ─────────────────────────────────────────────────────────────────────────────
const buildLogCsv = (logs) => {
  const header = "S.No,Priority,Action,Module,IP Address,Date & Time (IST)\n";
  const rows = logs
    .map((log, i) => {
      return [
        i + 1,
        `"${log.priority}"`,
        `"${log.action.replace(/"/g, '""')}"`,
        `"${log.module.replace(/"/g, '""')}"`,
        `"${log.ipAddress || "N/A"}"`,
        `"${new Date(log.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}"`,
      ].join(",");
    })
    .join("\n");

  return header + rows;
};

// ─────────────────────────────────────────────────────────────────────────────
// Job 1: Monthly cleanup of LOW-priority logs (runs on 1st of every month)
// ─────────────────────────────────────────────────────────────────────────────
const scheduleLowPriorityCleanup = () => {
  cron.schedule("0 0 1 * *", async () => {
    try {
      console.log("[CRON] Running monthly cleanup of LOW-priority logs...");

      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
      twoMonthsAgo.setDate(1);
      twoMonthsAgo.setHours(0, 0, 0, 0);

      const result = await prisma.auditLog.deleteMany({
        where: {
          priority: "LOW",
          createdAt: { lt: twoMonthsAgo },
        },
      });

      console.log(
        `[CRON] LOW cleanup done. Deleted ${result.count} records older than ${twoMonthsAgo.toISOString()}.`
      );
    } catch (error) {
      console.error("[CRON] Error during LOW-priority log cleanup:", error);
    }
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Job 2: Semi-annual email report + delete MEDIUM & HIGH logs
//   - Runs on: Jan 1st (reports Jul–Dec of last year)
//   - Runs on: Jul 1st (reports Jan–Jun of this year)
// ─────────────────────────────────────────────────────────────────────────────
const scheduleMediumHighReport = () => {
  // Cron: "0 0 1 1,7 *"  → 00:00 on Jan 1st and Jul 1st every year
  cron.schedule("0 0 1 1,7 *", async () => {
    try {
      const now = new Date();
      const currentMonth = now.getMonth(); // 0 = Jan, 6 = Jul

      // Determine the 6-month window that just ended
      let periodStart, periodEnd, periodLabel;

      if (currentMonth === 0) {
        // Jan 1st → report Jul 1 – Dec 31 of last year
        periodStart = new Date(now.getFullYear() - 1, 6, 1, 0, 0, 0, 0); // Jul 1 last year
        periodEnd   = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);     // Jan 1 this year
        periodLabel = `July 1 – December 31, ${now.getFullYear() - 1}`;
      } else {
        // Jul 1st → report Jan 1 – Jun 30 of this year
        periodStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);     // Jan 1 this year
        periodEnd   = new Date(now.getFullYear(), 6, 1, 0, 0, 0, 0);     // Jul 1 this year
        periodLabel = `January 1 – June 30, ${now.getFullYear()}`;
      }

      console.log(`[CRON] Fetching MEDIUM/HIGH logs for period: ${periodLabel}`);

      const logs = await prisma.auditLog.findMany({
        where: {
          priority: { in: ["MEDIUM", "HIGH"] },
          createdAt: { gte: periodStart, lt: periodEnd },
        },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      });

      console.log(`[CRON] Found ${logs.length} MEDIUM/HIGH logs to report.`);

      if (logs.length === 0) {
        console.log("[CRON] No MEDIUM/HIGH logs found for this period. Skipping email.");
      } else {
        // Send to the configured admin email (or EMAIL_USER as fallback)
        const reportRecipient =
          process.env.REPORT_EMAIL || process.env.EMAIL_USER;

        if (!reportRecipient) {
          console.error(
            "[CRON] No REPORT_EMAIL or EMAIL_USER set — cannot send log report. Logs will NOT be deleted."
          );
        } else {
          const html = buildLogEmailHtml(logs, periodLabel);
          const csvContent = buildLogCsv(logs);
          
          await sendMail(
            reportRecipient,
            `Hostal MGM — Audit Log Report: ${periodLabel}`,
            `Audit Log Report for ${periodLabel}. Total records: ${logs.length}. This is an automated report; these logs have been deleted from the database.`,
            html,
            [
              {
                filename: `Audit_Logs_${periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}.csv`,
                content: csvContent,
              }
            ]
          );
          console.log(`[CRON] Report email with CSV sent to ${reportRecipient}.`);

          // ── Delete ONLY after confirmed email delivery ─────────────────────
          const deleteResult = await prisma.auditLog.deleteMany({
            where: {
              priority: { in: ["MEDIUM", "HIGH"] },
              createdAt: { lt: periodEnd },
            },
          });

          console.log(
            `[CRON] Deleted ${deleteResult.count} MEDIUM/HIGH logs older than ${periodEnd.toISOString()}.`
          );
        }
      }
    } catch (error) {
      console.error(
        "[CRON] Error during MEDIUM/HIGH log report & cleanup:",
        error
      );
    }
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────
export const initCronJobs = () => {
  scheduleLowPriorityCleanup();
  scheduleMediumHighReport();
  console.log("[CRON] All cron jobs initialized.");
};
