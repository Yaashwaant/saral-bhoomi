import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authMiddleware = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      console.log("No token found");
      
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    // Accept demo token for development/demo use
    if (token === 'demo-jwt-token') {
      req.user = {
        _id: 'demo-user-id',
        name: 'Demo Officer',
        email: 'officer@saral.gov.in',
        role: 'officer',
        department: 'Land Acquisition'
      };
      return next();
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        // Temporary test user for development when MongoDB is not available
        if (process.env.NODE_ENV === 'development' && decoded.id === 'test-user-id') {
          req.user = {
            _id: 'test-user-id',
            name: 'Test Officer',
            email: 'officer@saral.gov.in',
            role: 'officer',
            department: 'Land Acquisition'
          };
          return next();
        }
        
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const authorize = (...roles) => {
  
  return (req, res, next) => {
    console.log("Authorizing user $req.user.role with roles:", roles);
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
}; 