import mongoose from 'mongoose';

/**
 * Validates if a value is a valid MongoDB ObjectId
 * @param {string} id - The ID to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidObjectId = (id) => {
  if (!id || typeof id !== 'string') {
    return false;
  }
  
  // Check for common invalid values
  if (id === 'undefined' || id === 'null' || id === '') {
    return false;
  }
  
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Middleware to validate ObjectId parameters
 * @param {string} paramName - The name of the parameter to validate
 * @returns {Function} - Express middleware function
 */
export const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName] || req.body[paramName];
    
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} provided. Please provide a valid ID.`,
        details: {
          received_id: id,
          type: typeof id,
          param_name: paramName
        }
      });
    }
    
    next();
  };
};

/**
 * Middleware to validate project_id specifically
 * @returns {Function} - Express middleware function
 */
export const validateProjectId = (req, res, next) => {
  const project_id = req.body.project_id || req.params.project_id || req.query.project_id;
  
  if (!project_id) {
    return res.status(400).json({
      success: false,
      message: 'Project ID is required. Please select a project.',
      details: {
        received_project_id: project_id,
        type: typeof project_id,
        body_keys: Object.keys(req.body || {}),
        params_keys: Object.keys(req.params || {}),
        query_keys: Object.keys(req.query || {})
      }
    });
  }
  
  if (!isValidObjectId(project_id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid project_id provided. Please select a valid project.',
      details: {
        received_project_id: project_id,
        type: typeof project_id,
        is_undefined_string: project_id === 'undefined',
        is_null_string: project_id === 'null',
        is_empty_string: project_id === '',
        is_valid_objectid: mongoose.Types.ObjectId.isValid(project_id)
      }
    });
  }
  
  next();
};

/**
 * Utility function to safely convert string to ObjectId
 * @param {string} id - The ID string to convert
 * @returns {mongoose.Types.ObjectId|null} - ObjectId if valid, null if invalid
 */
export const safeObjectId = (id) => {
  if (isValidObjectId(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return null;
};
