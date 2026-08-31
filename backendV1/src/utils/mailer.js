import nodemailer from "nodemailer";

const getTransporter = () => {
  const user = (process.env.EMAIL_USER || "").trim();
  const pass = (process.env.APP_PASSWORD || "").replace(/\s+/g, "").trim();

  if (!user || !pass) {
    console.error(
      "❌ Mailer Configuration Missing: EMAIL_USER or APP_PASSWORD environment variables are not set in the hosting environment!"
    );
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // SSL on port 465 is the most reliable across cloud platforms
    auth: {
      user,
      pass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
};

export const sendMail = async (to, subject, text, html) => {
  const user = (process.env.EMAIL_USER || "").trim();
  const pass = (process.env.APP_PASSWORD || "").replace(/\s+/g, "").trim();

  if (!user || !pass) {
    throw new Error("Email service is not configured. Please ensure EMAIL_USER and APP_PASSWORD environment variables are set in Render.");
  }

  const transporter = getTransporter();

  const mailOptions = {
    from: `"KMCT Hostel Management" <${user}>`,
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to} (MessageId: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, error.message || error);
    throw new Error(error.message || "Could not send email");
  }
};
