import nodemailer from "nodemailer";
import dns from "node:dns";

// Force IPv4 DNS resolution across Node to prevent ENETUNREACH in cloud environments (like Render)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

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
    secure: true, // SSL on port 465
    family: 4,    // Force IPv4 address to avoid ENETUNREACH on IPv6 in cloud hosts
    auth: {
      user,
      pass,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
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
