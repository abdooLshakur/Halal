const nodemailer = require("nodemailer");
const axios = require("axios");

const createMailer = ({ userEnvKey = "EMAIL_USER" } = {}) =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env[userEnvKey],
      pass: process.env.EMAIL_PASS,
    },
  });

const resolveMailerUser = (userEnvKey = "EMAIL_USER") =>
  process.env[userEnvKey] || process.env.EMAIL_USER;

const sendEmail = async ({
  to,
  subject,
  html,
  text,
  from,
  replyTo,
  userEnvKey = "EMAIL_USER",
}) => {
  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
    const resendPayload = {
      from: from || process.env.RESEND_FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    };

    await axios.post("https://api.resend.com/emails", resendPayload, {
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    return { provider: "resend" };
  }

  const transporter = createMailer({ userEnvKey });
  const mailerUser = resolveMailerUser(userEnvKey);

  await transporter.sendMail({
    from: from || `"Halal Matchmaking" <${mailerUser}>`,
    to,
    subject,
    html,
    text,
    ...(replyTo ? { replyTo } : {}),
  });

  return { provider: "gmail" };
};

module.exports = {
  createMailer,
  resolveMailerUser,
  sendEmail,
};
