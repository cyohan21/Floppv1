import nodemailer from "nodemailer"


const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, 
  port: 465,                   // 465 for SSL, 587 for TLS
  secure: true,                // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

type SendEmailParams = {
  to: string;
  subject: string;
  text: string;
}

export const sendEmail = async ({ to, subject, text }: SendEmailParams) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'Flopp.app'}" <${process.env.SMTP_USER}>`, 
      to,
      subject,
      text,
    });
    console.log('Email sent:', info.messageId);
  } 
  catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};