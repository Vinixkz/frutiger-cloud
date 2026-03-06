const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 10;

function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

function comparePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

function signToken(user) {
  const payload = {
    userId: user.id,
    username: user.username,
    email: user.email
  };

  const secret = process.env.JWT_SECRET || 'development-secret-change-me';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

module.exports = {
  hashPassword,
  comparePassword,
  signToken
};
