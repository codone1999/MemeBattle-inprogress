const Joi = require('joi');

// Helper schema for validating MongoDB ObjectIds
const objectIdSchema = Joi.string().pattern(/^[0-9a-fA-F]{24}$/, 'MongoDB ObjectId');

/**
 * Schema for POST /friends/requests
 */
const sendRequestSchema = Joi.object({
  toUserId: objectIdSchema.required().messages({
    'string.pattern.base': 'Invalid toUserId format'
  })
});

/**
 * Schema for params with :requestId
 */
const requestParamSchema = Joi.object({
  requestId: objectIdSchema.required().messages({
    'string.pattern.base': 'Invalid requestId format'
  })
});

/**
 * Schema for params with :friendId
 */
const friendParamSchema = Joi.object({
  friendId: objectIdSchema.required().messages({
    'string.pattern.base': 'Invalid friendId format'
  })
});


module.exports = {
  sendRequestSchema,
  requestParamSchema,
  friendParamSchema
};