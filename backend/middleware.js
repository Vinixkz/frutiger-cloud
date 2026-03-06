const jwt = require('jsonwebtoken');

// Middleware to enforce JWT-based authentication for protected routes.
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token missing.' });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'development-secret-change-me';

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = {
  authenticateToken
};
