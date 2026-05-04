const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    console.warn(`[Auth] REJECTED ${req.method} ${req.path} — no token`);
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    console.log(`[Auth] OK ${req.method} ${req.path} — userId: ${decoded.userId}`);
    next();
  } catch (err) {
    console.warn(`[Auth] INVALID token on ${req.method} ${req.path} — ${err.message}`);
    res.status(401).json({ error: 'Token is not valid' });
  }
};

module.exports = authMiddleware;
