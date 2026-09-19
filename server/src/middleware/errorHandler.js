const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Log error details (server-side only)
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      statusCode,
    });
  } else {
    console.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method}`);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    message = field === 'email'
      ? 'An account with this email already exists.'
      : `Duplicate value for field: ${field}`;
    statusCode = 409;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    message = errors.join('. ');
    statusCode = 400;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    message = 'Resource not found.';
    statusCode = 404;
  }

  // JWT errors (handled in middleware but just in case)
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid authentication token.';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Session expired. Please log in again.';
    statusCode = 401;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { errorHandler, AppError };
