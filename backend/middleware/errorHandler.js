import { ValidationError } from 'sequelize';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Custom error classes
class ApiError extends Error {
  constructor(message, statusCode, errorCode = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationApiError extends ApiError {
  constructor(message, details) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class DatabaseApiError extends ApiError {
  constructor(message, details = null) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

class AuthenticationApiError extends ApiError {
  constructor(message, details = null) {
    super(message, 401, 'AUTHENTICATION_ERROR', details);
  }
}

class AuthorizationApiError extends ApiError {
  constructor(message, details = null) {
    super(message, 403, 'AUTHORIZATION_ERROR', details);
  }
}

class FileUploadApiError extends ApiError {
  constructor(message, details = null) {
    super(message, 400, 'FILE_UPLOAD_ERROR', details);
  }
}

class PaymentApiError extends ApiError {
  constructor(message, details = null) {
    super(message, 400, 'PAYMENT_ERROR', details);
  }
}

// Error codes mapping
const ERROR_CODES = {
  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
  // Authentication errors (401)
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  
  // Authorization errors (403)
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  ROLE_REQUIRED: 'ROLE_REQUIRED',
  
  // Not found errors (404)
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  
  // Conflict errors (409)
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  
  // File upload errors (400)
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_CORRUPTED: 'FILE_CORRUPTED',
  
  // Payment errors (400)
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  PAYMENT_TIMEOUT: 'PAYMENT_TIMEOUT',
  
  // Database errors (500)
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  QUERY_ERROR: 'QUERY_ERROR',
  
  // Server errors (500)
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR'
};

// Error messages mapping
const ERROR_MESSAGES = {
  [ERROR_CODES.VALIDATION_ERROR]: 'Validation failed',
  [ERROR_CODES.INVALID_INPUT]: 'Invalid input provided',
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: 'Required field is missing',
  [ERROR_CODES.INVALID_FORMAT]: 'Invalid format provided',
  [ERROR_CODES.DUPLICATE_ENTRY]: 'Entry already exists',
  [ERROR_CODES.AUTHENTICATION_ERROR]: 'Authentication failed',
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid credentials',
  [ERROR_CODES.TOKEN_EXPIRED]: 'Token has expired',
  [ERROR_CODES.INVALID_TOKEN]: 'Invalid token provided',
  [ERROR_CODES.ACCOUNT_LOCKED]: 'Account is temporarily locked',
  [ERROR_CODES.AUTHORIZATION_ERROR]: 'Authorization failed',
  [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions',
  [ERROR_CODES.ROLE_REQUIRED]: 'Role is required for this action',
  [ERROR_CODES.RESOURCE_NOT_FOUND]: 'Resource not found',
  [ERROR_CODES.USER_NOT_FOUND]: 'User not found',
  [ERROR_CODES.PROJECT_NOT_FOUND]: 'Project not found',
  [ERROR_CODES.FILE_NOT_FOUND]: 'File not found',
  [ERROR_CODES.RESOURCE_CONFLICT]: 'Resource conflict',
  [ERROR_CODES.ALREADY_EXISTS]: 'Resource already exists',
  [ERROR_CODES.FILE_UPLOAD_ERROR]: 'File upload failed',
  [ERROR_CODES.FILE_TOO_LARGE]: 'File size exceeds limit',
  [ERROR_CODES.INVALID_FILE_TYPE]: 'Invalid file type',
  [ERROR_CODES.FILE_CORRUPTED]: 'File is corrupted',
  [ERROR_CODES.PAYMENT_ERROR]: 'Payment processing failed',
  [ERROR_CODES.PAYMENT_FAILED]: 'Payment failed',
  [ERROR_CODES.INSUFFICIENT_FUNDS]: 'Insufficient funds',
  [ERROR_CODES.PAYMENT_TIMEOUT]: 'Payment timeout',
  [ERROR_CODES.DATABASE_ERROR]: 'Database operation failed',
  [ERROR_CODES.CONNECTION_ERROR]: 'Database connection failed',
  [ERROR_CODES.QUERY_ERROR]: 'Database query failed',
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: 'Internal server error',
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
  [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 'External service error'
};

// Main error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Handle Sequelize validation errors
  if (err instanceof ValidationError) {
    const details = err.errors.map(e => ({
      field: e.path,
      message: e.message,
      value: e.value,
      validatorKey: e.validatorKey
    }));
    
    error = new ValidationApiError('Database validation failed', details);
  }

  // Handle JWT errors
  if (err instanceof jwt.JsonWebTokenError) {
    error = new AuthenticationApiError('Invalid token', { tokenError: err.message });
  }

  if (err instanceof jwt.TokenExpiredError) {
    error = new AuthenticationApiError('Token expired', { expiredAt: err.expiredAt });
  }

  // Handle Multer errors
  if (err instanceof multer.MulterError) {
    let details = { multerError: err.code };
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        error = new FileUploadApiError('File too large', details);
        break;
      case 'LIMIT_FILE_COUNT':
        error = new FileUploadApiError('Too many files', details);
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        error = new FileUploadApiError('Unexpected file field', details);
        break;
      default:
        error = new FileUploadApiError('File upload error', details);
    }
  }

  // Handle file system errors
  if (err.code === 'ENOENT') {
    error = new ApiError('File not found', 404, ERROR_CODES.FILE_NOT_FOUND);
  }

  if (err.code === 'EACCES') {
    error = new ApiError('Permission denied', 403, ERROR_CODES.AUTHORIZATION_ERROR);
  }

  // Handle database connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    error = new DatabaseApiError('Database connection failed', { 
      code: err.code,
      host: err.hostname,
      port: err.port 
    });
  }

  // Handle timeout errors
  if (err.code === 'ETIMEDOUT') {
    error = new ApiError('Request timeout', 408, 'TIMEOUT_ERROR');
  }

  // Handle custom API errors
  if (err instanceof ApiError) {
    error = err;
  }

  // Default error response
  const response = {
    success: false,
    error: {
      code: error.errorCode || ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: error.message || ERROR_MESSAGES[ERROR_CODES.INTERNAL_SERVER_ERROR],
      details: error.details || null,
      timestamp: new Date().toISOString(),
      path: req.url,
      method: req.method
    }
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  // Set status code
  const statusCode = error.statusCode || 500;
  
  // Send error response
  res.status(statusCode).json(response);
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Validation error handler
const handleValidationError = (validationResult) => {
  if (validationResult.error) {
    const details = validationResult.error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));
    
    throw new ValidationApiError('Validation failed', details);
  }
  return validationResult.value;
};

// Database error handler
const handleDatabaseError = (error, operation = 'database operation') => {
  if (error instanceof ValidationError) {
    throw new ValidationApiError('Database validation failed', error.errors);
  }
  
  if (error.name === 'SequelizeUniqueConstraintError') {
    throw new ValidationApiError('Duplicate entry', {
      field: error.errors[0]?.path,
      value: error.errors[0]?.value
    });
  }
  
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    throw new ValidationApiError('Referenced record not found', {
      table: error.table,
      field: error.fields[0]
    });
  }
  
  throw new DatabaseApiError(`${operation} failed`, {
    name: error.name,
    message: error.message
  });
};

// File cleanup on error
const cleanupFiles = (files) => {
  if (!files || !Array.isArray(files)) return;
  
  files.forEach(file => {
    if (file.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
        console.log(`Cleaned up file: ${file.path}`);
      } catch (cleanupError) {
        console.error(`Failed to cleanup file ${file.path}:`, cleanupError);
      }
    }
  });
};

export {
  errorHandler,
  asyncHandler,
  handleValidationError,
  handleDatabaseError,
  cleanupFiles,
  ApiError,
  ValidationApiError,
  DatabaseApiError,
  AuthenticationApiError,
  AuthorizationApiError,
  FileUploadApiError,
  PaymentApiError,
  ERROR_CODES,
  ERROR_MESSAGES
}; 