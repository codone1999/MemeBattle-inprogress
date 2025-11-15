const Joi = require('joi');

const searchUserSchema = Joi.object({
  username: Joi.string().trim().min(2).required().messages({
    'string.min': 'Username query must be at least 2 characters',
    'any.required': 'Username query is required'
  })
});

module.exports = {
  searchUserSchema
};