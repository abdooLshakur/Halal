const axios = require("axios");

async function getAuthToken() {
  try {
   const res = await axios.post(
  `${process.env.BANK9JA_BASE_URL}/authenticate`,
  {},
  {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${Buffer.from(
        `${process.env.BANK9JA_PUBLIC_KEY}:${process.env.BANK9JA_PRIVATE_KEY}`
      ).toString("base64")}`,
    },
  }
);


    // ✅ Pull token from Bank9ja's "data" object
    return res.data.data.accessToken;
  } catch (err) {
    console.error("Bank9ja Auth Error:", err.response?.data || err.message);
    throw new Error("Failed to authenticate with Bank9ja");
  }
}

async function bank9jaRequest(method, endpoint, data = {}) {
  const token = await getAuthToken();

  return axios({
    method,
    url: `${process.env.BANK9JA_BASE_URL}${endpoint}`,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    data,
  });
}

module.exports = bank9jaRequest;