import * as SibApiV3Sdk from "@getbrevo/brevo";

/**
 * Send an email using Brevo's HTTP API.
 * Brevo uses HTTPS (port 443) which is NOT blocked by Render's free tier,
 * unlike SMTP ports (25, 465, 587) which Render blocks permanently on free plans.
 */
export const sendMail = async (to, subject, text, html) => {
  const apiKey = (process.env.BREVO_API_KEY || "").trim();
  const senderEmail = (process.env.EMAIL_USER || "").trim();
  const senderName = process.env.EMAIL_SENDER_NAME || "KMCT Hostel Management";

  if (!apiKey) {
    throw new Error(
      "Email service is not configured. Please set BREVO_API_KEY in your Render environment variables."
    );
  }

  if (!senderEmail) {
    throw new Error(
      "Email sender is not configured. Please set EMAIL_USER in your Render environment variables."
    );
  }

  // Initialize Brevo API client
  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  apiInstance.setApiKey(
    SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
    apiKey
  );

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.sender = { name: senderName, email: senderEmail };
  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.textContent = text;
  sendSmtpEmail.htmlContent = html;

  try {
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(
      `✅ Email sent successfully via Brevo to ${to} (MessageId: ${response?.body?.messageId || "N/A"})`
    );
    return response;
  } catch (error) {
    const errMsg =
      error?.response?.text || error?.message || "Unknown Brevo error";
    console.error(`❌ Brevo email error to ${to}:`, errMsg);
    throw new Error(errMsg);
  }
};
