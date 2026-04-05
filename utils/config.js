const isProduction = process.env.NODE_ENV === "production";

const cookieDomain = process.env.COOKIE_DOMAIN || ".halalmatchmakings.com";
const frontendBaseUrl =
  process.env.FRONTEND_BASE_URL || "https://www.halalmatchmakings.com";

const allowedOrigins = [
  "http://localhost:3000",
  "https://halalmatchmakings.com",
  "https://www.halalmatchmakings.com",
];

const buildCookieOptions = ({
  httpOnly,
  maxAge,
  includeDomain = true,
  sameSite = isProduction ? "None" : "Lax",
} = {}) => ({
  path: "/",
  httpOnly,
  secure: isProduction,
  sameSite,
  ...(typeof maxAge === "number" ? { maxAge } : {}),
  ...(isProduction && includeDomain ? { domain: cookieDomain } : {}),
});

module.exports = {
  isProduction,
  cookieDomain,
  frontendBaseUrl,
  allowedOrigins,
  buildCookieOptions,
};
