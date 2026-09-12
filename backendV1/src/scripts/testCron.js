import { prisma, connectDB, disConnectDB } from "../config/prisma.js";
import { sendMail } from "../utils/mailer.js";
import dotenv from "dotenv";

dotenv.config();

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
        This is a TEST automated report.
      </p>
    </div>`;
};

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

const runTest = async () => {
  try {
    await connectDB();
    console.log("=== STARTING TEST ===");
    
    // 1. Test LOW priority deletion (but we won't actually delete anything just to be safe, or we'll look for recent)
    const lowLogsCount = await prisma.auditLog.count({
      where: { priority: "LOW" }
    });
    console.log(`[TEST] Found ${lowLogsCount} LOW priority logs in the DB (Total).`);
    console.log(`[TEST] The cron job would delete logs older than 2 months.`);

    // 2. Test Email Sending for MEDIUM/HIGH
    console.log("\n[TEST] Fetching ALL MEDIUM/HIGH logs for the email test...");
    const logs = await prisma.auditLog.findMany({
      where: {
        priority: { in: ["MEDIUM", "HIGH"] },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      take: 50 // Limit to 50 for the test email
    });

    console.log(`[TEST] Found ${logs.length} MEDIUM/HIGH logs.`);

    const reportRecipient = process.env.REPORT_EMAIL || process.env.EMAIL_USER;

    if (!reportRecipient) {
      console.error("[TEST] No REPORT_EMAIL or EMAIL_USER set in .env. Cannot test email sending.");
    } else if (logs.length > 0) {
      const html = buildLogEmailHtml(logs, "ALL TIME (TEST RUN)");
      const csvContent = buildLogCsv(logs);

      console.log(`[TEST] Attempting to send email with CSV to ${reportRecipient}...`);
      
      await sendMail(
        reportRecipient,
        `Hostal MGM — TEST Audit Log Report`,
        `Audit Log Report. Total records: ${logs.length}.`,
        html,
        [
          {
            filename: `Test_Audit_Logs.csv`,
            content: csvContent,
          }
        ]
      );
      console.log(`[TEST] Success! Email with CSV sent to ${reportRecipient}.`);
    }

    console.log("=== TEST COMPLETE ===");
    await disConnectDB();
    process.exit(0);
  } catch (err) {
    console.error("[TEST] Error:", err);
    await disConnectDB();
    process.exit(1);
  }
};

runTest();
