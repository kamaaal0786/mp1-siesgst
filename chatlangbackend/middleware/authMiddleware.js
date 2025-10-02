// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Attach user to the request
      req.user = decoded.user;
      next();
    } catch (error) {
      res.status(401).json({ msg: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    res.status(401).json({ msg: 'Not authorized, no token' });
  }
};

module.exports = { protect };