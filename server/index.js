require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { sendOTPEmail } = require("./mailer");
const cron = require("node-cron");
const EscalationService = require("./escalationService");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Email + Escalation service is running" });
});

app.post("/send-otp", async (req, res) => {
  try {
    const { email, otp, grievanceId } = req.body;

    if (!email || !otp || !grievanceId) {
      return res.status(400).json({
        success: false,
        error: "Email, OTP, and grievanceId are required",
      });
    }

    const result = await sendOTPEmail(email, otp, grievanceId);

    if (result.success) {
      res.json({
        success: true,
        message: "OTP email sent successfully",
        messageId: result.messageId,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || "Failed to send email",
      });
    }
  } catch (error) {
    console.error("❌ Error in /send-otp endpoint:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

cron.schedule("*/2 * * * *", async () => {
  console.log("⏰ Running 2-minute escalation check...");
  try {
    await EscalationService.checkAndEscalate();
  } catch (err) {
    console.error("❌ Escalation error:", err);
  }
});

// Backup: Every 1 hour
cron.schedule("0 * * * *", async () => {
  console.log("⏰ Running hourly escalation check...");
  try {
    await EscalationService.checkAndEscalate();
  } catch (err) {
    console.error("❌ Escalation error:", err);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Email + Escalation service running on port ${PORT}`);
});
