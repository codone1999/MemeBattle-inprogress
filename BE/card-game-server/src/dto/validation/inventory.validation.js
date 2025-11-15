const Joi = require('joi');

// Helper schema for validating MongoDB ObjectIds
const objectIdSchema = Joi.string().pattern(/^[0-9a-fA-F]{24}$/, 'MongoDB ObjectId');

/**
 * Schema for POST /inventory/cards
 */
const addCardSchema = Joi.object({
  cardId: objectIdSchema.required().messages({
    'string.pattern.base': 'Invalid Card ID format'
  }),
  quantity: Joi.number().integer().min(1).default(1)
});

/**
 * Schema for POST /inventory/characters
 */
const addCharacterSchema = Joi.object({
  characterId: objectIdSchema.required().messages({
    'string.pattern.base': 'Invalid Character ID format'
  })
});

/**
 * Schema for params in DELETE /inventory/cards/:cardId
 */
const removeCardParamsSchema = Joi.object({
  cardId: objectIdSchema.required().messages({
    'string.pattern.base': 'Invalid Card ID format'
  })
});

/**
 * Schema for body in DELETE /inventory/cards/:cardId
 */
const removeCardBodySchema = Joi.object({
  quantity: Joi.number().integer().min(1).default(1)
});

module.exports = {
  addCardSchema,
  addCharacterSchema,
  removeCardParamsSchema,
  removeCardBodySchema
};