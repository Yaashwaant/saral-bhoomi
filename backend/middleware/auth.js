import jwt from 'jsonwebtoken';
import User from '../models/mongo/User.js';

// Enhanced JWT verification with refresh token support
export const authMiddleware = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Get token from cookie (for httpOnly cookies)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      console.log("No token found");
      
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
        code: 'NO_TOKEN'
      });
    }

    // Accept demo token for development/demo use
    if (token === 'demo-jwt-token') {
      req.user = {
        id: 'demo-user-id',
        _id: 'demo-user-id',
        name: 'Demo Officer',
        email: 'officer@saral.gov.in',
        role: 'officer',
        department: 'Land Acquisition',
        isActive: true
      };
      return next();
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if token is expired
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        return res.status(401).json({
          success: false,
          message: 'Token has expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        // Temporary test user for development when database is not available
        if (process.env.NODE_ENV === 'development' && decoded.id === 'test-user-id') {
          req.user = {
            id: 'test-user-id',
            _id: 'test-user-id',
            name: 'Test Officer',
            email: 'officer@saral.gov.in',
            role: 'officer',
            department: 'Land Acquisition',
            isActive: true
          };
          return next();
        }
        
        return res.status(401).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Check if user is active
      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated',
          code: 'USER_INACTIVE'
        });
      }

      // Add user to request
      req.user = user;
      next();
    } catch (err) {
      console.error('Token verification error:', err);
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
        code: 'TOKEN_ERROR'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      code: 'SERVER_ERROR'
    });
  }
};

// Enhanced role-based authorization
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }

    console.log(`Authorizing user ${req.user.role} with required roles:`, roles);
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route. Required roles: ${roles.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSIONS',
        userRole: req.user.role,
        requiredRoles: roles
      });
    }
    next();
  };
};

// Specific role authorizations
export const authorizeAdmin = authorize('admin');
export const authorizeOfficer = authorize('admin', 'officer');
export const authorizeAgent = authorize('admin', 'officer', 'agent');

// Enhanced refresh token middleware
export const refreshTokenMiddleware = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      // Get user
      const user = await User.findById(decoded.id).select('-password');

      if (!user || !user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }

      // Generate new access token - TODO: Implement JWT generation
      // const newAccessToken = user.getSignedJwtToken();
      
      // Generate new refresh token - TODO: Implement refresh token generation
      // const newRefreshToken = user.getRefreshToken();

      // req.newTokens = {
      //   accessToken: newAccessToken,
      //   refreshToken: newRefreshToken
      // };
      
      req.user = user;
      next();
    } catch (err) {
      console.error('Refresh token verification error:', err);
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Refresh token has expired',
          code: 'REFRESH_TOKEN_EXPIRED'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }
  } catch (error) {
    console.error('Refresh token middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      code: 'SERVER_ERROR'
    });
  }
};

// Session validation middleware
export const validateSession = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Session not found',
        code: 'NO_SESSION'
      });
    }

    // Check if user is still active
    const user = await User.findByPk(req.user.id, {
      attributes: ['isActive', 'lastLogin']
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Session is invalid - user account is deactivated',
        code: 'INVALID_SESSION'
      });
    }

    // Update last activity (optional - can be used for session timeout)
    // user.lastActivity = new Date();
    // await user.save();

    next();
  } catch (error) {
    console.error('Session validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      code: 'SERVER_ERROR'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token && token !== 'demo-jwt-token') {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id, {
          attributes: { exclude: ['password'] }
        });
        
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (err) {
        // Token is invalid, but we don't fail the request
        console.log('Optional auth: Invalid token, continuing without user');
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next(); // Continue without user
  }
}; 