const axios = require("axios");

const bank9jaClient = axios.create({
  baseURL: "https://baastest.9psb.com.ng:8445/payment-gateway-api/v1",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Debug logs for requests/responses
bank9jaClient.interceptors.request.use((config) => {
  console.log("➡️ Bank9ja Request:", {
    method: config.method,
    url: config.baseURL + config.url,
    headers: config.headers,
    body: config.data,
  });
  return config;
});

bank9jaClient.interceptors.response.use(
  (response) => {
    console.log("⬅️ Bank9ja Response:", {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error("❌ Bank9ja Response Error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

module.exports = bank9jaClient;
