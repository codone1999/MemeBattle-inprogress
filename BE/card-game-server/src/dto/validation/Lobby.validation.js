const Joi = require('joi');

/**
 * Validation schema for creating a lobby
 */
const createLobbySchema = Joi.object({
  lobbyName: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Lobby name is required',
      'string.min': 'Lobby name must be at least 3 characters',
      'string.max': 'Lobby name cannot exceed 50 characters'
    }),
  
  mapId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.empty': 'Map ID is required',
      'string.pattern.base': 'Invalid map ID format'
    }),
  
  isPrivate: Joi.boolean()
    .default(false),
  
  password: Joi.string()
    .min(4)
    .max(20)
    .when('isPrivate', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional().allow(null, '')
    })
    .messages({
      'string.min': 'Password must be at least 4 characters',
      'string.max': 'Password cannot exceed 20 characters',
      'any.required': 'Password is required for private lobbies'
    }),
  
  gameSettings: Joi.object({
    turnTimeLimit: Joi.number()
      .integer()
      .min(30)
      .max(300)
      .default(60)
      .messages({
        'number.min': 'Turn time limit must be at least 30 seconds',
        'number.max': 'Turn time limit cannot exceed 300 seconds'
      }),
    
    allowSpectators: Joi.boolean()
      .default(false)
  }).default({
    turnTimeLimit: 60,
    allowSpectators: false
  })
});

/**
 * Validation schema for joining a lobby
 */
const joinLobbySchema = Joi.object({
  password: Joi.string()
    .min(4)
    .max(20)
    .optional()
    .allow(null, '')
    .messages({
      'string.min': 'Password must be at least 4 characters',
      'string.max': 'Password cannot exceed 20 characters'
    })
});

/**
 * Validation schema for lobby ID parameter
 */
const lobbyIdParamSchema = Joi.object({
  lobbyId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.empty': 'Lobby ID is required',
      'string.pattern.base': 'Invalid lobby ID format'
    })
});

/**
 * Validation schema for updating lobby settings
 */
const updateLobbySettingsSchema = Joi.object({
  lobbyName: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Lobby name must be at least 3 characters',
      'string.max': 'Lobby name cannot exceed 50 characters'
    }),
  
  mapId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid map ID format'
    }),
  
  gameSettings: Joi.object({
    turnTimeLimit: Joi.number()
      .integer()
      .min(30)
      .max(300)
      .optional()
      .messages({
        'number.min': 'Turn time limit must be at least 30 seconds',
        'number.max': 'Turn time limit cannot exceed 300 seconds'
      }),
    
    allowSpectators: Joi.boolean()
      .optional()
  }).optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

/**
 * Validation schema for selecting a deck
 */
const selectDeckSchema = Joi.object({
  deckId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.empty': 'Deck ID is required',
      'string.pattern.base': 'Invalid deck ID format'
    })
});

/**
 * Validation schema for selecting a character
 */
const selectCharacterSchema = Joi.object({
  characterId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.empty': 'Character ID is required',
      'string.pattern.base': 'Invalid character ID format'
    })
});

/**
 * Validation schema for kicking a player
 */
const kickPlayerSchema = Joi.object({
  playerId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.empty': 'Player ID is required',
      'string.pattern.base': 'Invalid player ID format'
    })
});

/**
 * Validation schema for query parameters (get public lobbies)
 */
const getLobbiesQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.min': 'Page must be at least 1'
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .default(20)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 50'
    }),
  
  status: Joi.string()
    .valid('waiting', 'ready')
    .optional()
    .messages({
      'any.only': 'Status must be either "waiting" or "ready"'
    }),
  
  showFull: Joi.boolean()
    .default(false)
});

module.exports = {
  createLobbySchema,
  joinLobbySchema,
  lobbyIdParamSchema,
  updateLobbySettingsSchema,
  selectDeckSchema,
  selectCharacterSchema,
  kickPlayerSchema,
  getLobbiesQuerySchema
};