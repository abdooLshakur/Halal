const isProduction = process.env.NODE_ENV === "production";

const cookieDomain = process.env.COOKIE_DOMAIN || ".halalmatchmakings.com";
const frontendBaseUrl =
  process.env.FRONTEND_BASE_URL || "https://www.halalmatchmakings.com";
const resetPasswordTokenTtl = process.env.RESET_PASSWORD_TOKEN_TTL || "4h";

const durationToMs = (duration) => {
  if (typeof duration === "number") return duration;
  if (typeof duration !== "string") return 4 * 60 * 60 * 1000;

  const trimmed = duration.trim().toLowerCase();
  const match = trimmed.match(/^(\d+)\s*([smhd])$/);

  if (!match) {
    return 4 * 60 * 60 * 1000;
  }

  const value = Number(match[1]);
  const unit = match[2];
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit];
};

const resetPasswordTokenTtlMs = durationToMs(resetPasswordTokenTtl);

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
  resetPasswordTokenTtl,
  resetPasswordTokenTtlMs,
  allowedOrigins,
  buildCookieOptions,
};
