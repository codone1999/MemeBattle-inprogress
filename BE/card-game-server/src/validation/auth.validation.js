import { object, string, exist, optional, required } from 'joi';

/**
 * Register Validation Schema
 */
const registerSchema = object({
  email: string()
    .email()
    .required()
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),

  username: string()
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

  password: string()
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

  displayName: string()
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
 */
const loginSchema = object({
  email: string()
    .email()
    .lowercase()
    .trim()
    .when('username', {
      is: exist(),
      then: optional(),
      otherwise: required()
    })
    .messages({
      'string.email': 'Please provide a valid email address'
    }),

  username: string()
    .alphanum()
    .lowercase()
    .trim()
    .when('email', {
      is: exist(),
      then: optional(),
      otherwise: required()
    })
    .messages({
      'string.alphanum': 'Username must contain only letters and numbers'
    }),

  password: string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
}).xor('email', 'username')
  .messages({
    'object.xor': 'Please provide either email or username'
  });

/**
 * Email Verification Schema
 */
const emailVerificationSchema = object({
  token: string()
    .required()
    .trim()
    .messages({
      'any.required': 'Verification token is required'
    })
});

/**
 * Refresh Token Schema
 */
const refreshTokenSchema = object({
  refreshToken: string()
    .required()
    .messages({
      'any.required': 'Refresh token is required'
    })
});

/**
 * Resend Verification Email Schema
 */
const resendVerificationSchema = object({
  email: string()
    .email()
    .required()
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
});

export default {
  registerSchema,
  loginSchema,
  emailVerificationSchema,
  refreshTokenSchema,
  resendVerificationSchema
};