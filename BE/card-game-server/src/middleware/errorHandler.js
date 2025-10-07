export function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err);

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Handle specific error types
  if (err.message.includes('already exists')) {
    statusCode = 409; // Conflict
  } else if (err.message.includes('not found')) {
    statusCode = 404; // Not found
  } else if (err.message.includes('Invalid') || err.message.includes('required')) {
    statusCode = 400; // Bad request
  } else if (err.message.includes('token') || err.message.includes('Unauthorized')) {
    statusCode = 401; // Unauthorized
  } else if (err.message.includes('access denied') || err.message.includes('forbidden')) {
    statusCode = 403; // Forbidden
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err 
    })
  });
}

// 404 handler
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
}