import nodemailer from "nodemailer";

const createTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.APP_PASSWORD;

  if (!user || !pass) {
    throw new Error(
      "Email service is not configured. Please set EMAIL_USER and APP_PASSWORD in your Railway environment variables."
    );
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for 587 (STARTTLS)
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

export const sendMail = async (to, subject, text, html) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Hostal MGM" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw error;
  }
};
