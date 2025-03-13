/**
 * Custom API Error Class
 * Extends the built-in Error class to include HTTP status code
 */
class ApiError extends Error {
    /**
     * Create a new API error
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     */
    constructor(message, statusCode) {
      super(message);
      
      this.statusCode = statusCode;
      this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
      this.isOperational = true; // Operational errors are expected and can be handled gracefully
  
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  module.exports = ApiError;