const axios = require("axios");

const RESEND_BASE_URL = "https://api.resend.com";
const RESEND_BATCH_SIZE = 100;
const RESEND_RATE_DELAY_MS = 600;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ensureResendConfigured = () => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  if (!from) {
    throw new Error("Missing RESEND_FROM_EMAIL");
  }

  return { apiKey, from };
};

const chunk = (items, size) => {
  const batches = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
};

const sendBatchEmails = async ({
  recipients,
  subject,
  html,
  text,
  replyTo,
}) => {
  const { apiKey, from } = ensureResendConfigured();
  const batches = chunk(recipients, RESEND_BATCH_SIZE);
  const results = [];

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    const payload = batch.map((recipient) => ({
      from,
      to: [recipient],
      subject,
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }));

    const response = await axios.post(`${RESEND_BASE_URL}/emails/batch`, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    results.push({
      batchNumber: index + 1,
      recipients: batch,
      providerResponse: response.data,
    });

    if (index < batches.length - 1) {
      await sleep(RESEND_RATE_DELAY_MS);
    }
  }

  return {
    batchCount: batches.length,
    batchSize: RESEND_BATCH_SIZE,
    results,
  };
};

module.exports = {
  ensureResendConfigured,
  sendBatchEmails,
};
