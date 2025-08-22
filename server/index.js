require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sendOTPEmail } = require('./mailer');

const app = express();
const PORT =  3001;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Email service is running' });
});

// Send OTP email endpoint
app.post('/send-otp', async (req, res) => {
  try {
    const { email, otp, grievanceId } = req.body;

    if (!email || !otp || !grievanceId) {
      return res.status(400).json({
        success: false,
        error: 'Email, OTP, and grievanceId are required'
      });
    }

    const result = await sendOTPEmail(email, otp, grievanceId);

    if (result.success) {
      res.json({
        success: true,
        message: 'OTP email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to send email'
      });
    }
  } catch (error) {
    console.error('Error in send-otp endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Email service running on port ${PORT}`);
});