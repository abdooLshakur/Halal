const nodemailer = require("nodemailer");

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

module.exports = {
  createMailer,
  resolveMailerUser,
};
