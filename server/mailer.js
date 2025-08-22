const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
      user: "yewalesatwik@gmail.com",  // your email
      pass: "zxfg yglu cjao zvyj"   // app password
    },
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.log('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to send emails');
  }
});

// Send OTP email function
const sendOTPEmail = async (to, otp, grievanceId) => {
  try {
    const mailOptions = {
      from: `"Grievance System" <${process.env.SMTP_USER}>`,
      to: to,
      subject: 'OTP for Grievance Resolution',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Grievance Resolution OTP</h2>
          <p>Dear Citizen,</p>
          <p>Your OTP for resolving grievance <strong>#${grievanceId}</strong> is:</p>
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; margin: 20px 0;">
            <h1 style="color: #2563eb; margin: 0; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p>This OTP will expire in 15 minutes. Please do not share it with anyone.</p>
          <p>If you didn't request this OTP, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated message from the Government Grievance System.
          </p>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendOTPEmail };