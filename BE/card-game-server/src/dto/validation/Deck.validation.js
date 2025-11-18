const Joi = require('joi');

/**
 * Deck Validation Schemas for Queen's Blood Game
 * 
 * Business Rules:
 * - BR-1: Deck must have a title (1-50 characters)
 * - BR-2: Deck must have 15-30 cards
 * - BR-3: Cards must exist in user's inventory
 * - BR-4: User can have max 10 decks
 * - BR-5: Only one deck can be active at a time
 * - BR-6: No duplicate cards in deck (each card can appear only once)
 * 
 * Note: Characters are no longer part of deck construction.
 * Characters are selected in the Game Lobby before match starts.
 */

/**
 * Create Deck Validation Schema
 */
const createDeckSchema = Joi.object({
  deckTitle: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Deck title is required',
      'string.min': 'Deck title must be at least 1 character',
      'string.max': 'Deck title cannot exceed 50 characters',
      'any.required': 'Deck title is required'
    }),
  
  cards: Joi.array()
    .items(
      Joi.object({
        cardId: Joi.string()
          .trim()
          .pattern(/^[0-9a-fA-F]{24}$/)
          .required()
          .messages({
            'string.pattern.base': 'Invalid card ID format',
            'any.required': 'Card ID is required'
          }),
        position: Joi.number()
          .integer()
          .min(0)
          .max(29)
          .optional()
          .messages({
            'number.base': 'Position must be a number',
            'number.min': 'Position must be at least 0',
            'number.max': 'Position cannot exceed 29'
          })
      })
    )
    .min(15)
    .max(30)
    .required()
    .messages({
      'array.min': 'Deck must contain at least 15 cards',
      'array.max': 'Deck cannot contain more than 30 cards',
      'any.required': 'Cards are required for deck creation'
    }),
  
  isActive: Joi.boolean()
    .optional()
    .default(false)
    .messages({
      'boolean.base': 'isActive must be a boolean value'
    })
});

/**
 * Update Deck Validation Schema
 */
const updateDeckSchema = Joi.object({
  deckTitle: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .optional()
    .messages({
      'string.empty': 'Deck title cannot be empty',
      'string.min': 'Deck title must be at least 1 character',
      'string.max': 'Deck title cannot exceed 50 characters'
    }),
  
  cards: Joi.array()
    .items(
      Joi.object({
        cardId: Joi.string()
          .trim()
          .pattern(/^[0-9a-fA-F]{24}$/)
          .required()
          .messages({
            'string.pattern.base': 'Invalid card ID format',
            'any.required': 'Card ID is required'
          }),
        position: Joi.number()
          .integer()
          .min(0)
          .max(29)
          .optional()
          .messages({
            'number.base': 'Position must be a number',
            'number.min': 'Position must be at least 0',
            'number.max': 'Position cannot exceed 29'
          })
      })
    )
    .min(15)
    .max(30)
    .optional()
    .messages({
      'array.min': 'Deck must contain at least 15 cards',
      'array.max': 'Deck cannot contain more than 30 cards'
    }),
  
  isActive: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'isActive must be a boolean value'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

/**
 * Deck ID Parameter Validation Schema
 */
const deckIdParamSchema = Joi.object({
  deckId: Joi.string()
    .trim()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.empty': 'Deck ID is required',
      'string.pattern.base': 'Invalid deck ID format',
      'any.required': 'Deck ID is required'
    })
});

/**
 * Set Active Deck Validation Schema
 */
const setActiveDeckSchema = Joi.object({
  isActive: Joi.boolean()
    .valid(true)
    .required()
    .messages({
      'any.only': 'isActive must be true to activate a deck',
      'any.required': 'isActive field is required'
    })
});

module.exports = {
  createDeckSchema,
  updateDeckSchema,
  deckIdParamSchema,
  setActiveDeckSchema
};