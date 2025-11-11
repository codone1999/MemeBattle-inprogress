const Joi = require('joi');

/**
 * Register Validation Schema
 */
const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),

  username: Joi.string()
    .alphanum()
    .min(3)
    .max(20)
    .required()
    .lowercase()
    .trim()
    .messages({
      'string.alphanum': 'Username must contain only letters and numbers',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must not exceed 20 characters',
      'any.required': 'Username is required'
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    .required()
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])'))
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),

  displayName: Joi.string()
    .min(2)
    .max(30)
    .required()
    .trim()
    .messages({
      'string.min': 'Display name must be at least 2 characters long',
      'string.max': 'Display name must not exceed 30 characters',
      'any.required': 'Display name is required'
    })
});

/**
 * Login Validation Schema
 * Fixed: Removed circular dependency
 */
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),

  username: Joi.string()
    .alphanum()
    .lowercase()
    .trim()
    .messages({
      'string.alphanum': 'Username must contain only letters and numbers'
    }),

  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
})
  .xor('email', 'username')
  .messages({
    'object.xor': 'Please provide either email or username'
  });

/**
 * Email Verification Schema
 */
const emailVerificationSchema = Joi.object({
  token: Joi.string()
    .required()
    .trim()
    .messages({
      'any.required': 'Verification token is required'
    })
});

/**
 * Refresh Token Schema
 */
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token is required'
    })
});

/**
 * Resend Verification Email Schema
 */
const resendVerificationSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
});

module.exports = {
  registerSchema,
  loginSchema,
  emailVerificationSchema,
  refreshTokenSchema,
  resendVerificationSchema
};