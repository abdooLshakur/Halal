const bcrypt = require('bcrypt');
const token = generateResetToken();
const hashedToken = await bcrypt.hash(token, 10);

// Save `hashedToken` and `expiresAt` in the database

const isTokenValid = await bcrypt.compare(receivedToken, storedHashedToken);
if (!isTokenValid || Date.now() > expiresAt) {
  throw new Error('Invalid or expired token');
}

const newHashedPassword = await bcrypt.hash(newPassword, 10);
// Update the user's password in the database
