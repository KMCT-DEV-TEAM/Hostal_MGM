import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail", // Assuming Gmail based on common usage of APP_PASSWORD
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.APP_PASSWORD,
  },
});

export const sendMail = async (to, subject, text, html) => {
  try {
    console.log(process.env.EMAIL_USER);
    console.log(process.env.APP_PASSWORD);
    const mailOptions = {
      from: process.env.EMAIL_USER || "noreply@hostelmanagement.com",
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Could not send email");
  }
};
