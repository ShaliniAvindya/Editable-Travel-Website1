const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    // Check for Authorization header
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.headers['x-auth-token']) {
      token = req.headers['x-auth-token'];
    }
    if (!token) {
      return res.status(401).json({ 
        message: 'Authentication required. Please provide a valid token.',
        details: 'No token provided in Authorization or x-auth-token header'
      });
    }

    // Extract and verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Check admin status
      if (!decoded.isAdmin) {
        return res.status(403).json({ 
          message: 'Access denied. Admin privileges required.',
          details: 'User is not an admin'
        });
      }

      // Attach user info to request
      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Token has expired. Please login again.',
          details: error.message
        });
      }
      return res.status(401).json({ 
        message: 'Invalid token. Please login again.',
        details: error.message
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      message: 'Internal server error during authentication',
      details: error.message
    });
  }
};

module.exports = auth;