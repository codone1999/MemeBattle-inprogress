// BE/card-game-server/DB/seed-maps.js

// Load environment variables from .env file
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const { connectDatabase, disconnectDatabase } = require('../src/config/database');
const Map = require('../src/models/Map.model');

const maps = [
  {
    name: 'Starter Arena',
    image: '/maps/starter-arena.png',
    themeColor: '#4CAF50',
    gridSize: {
      width: 10,
      height: 3
    },
    specialSquares: [
      {
        position: { x: 5, y: 1 },
        type: 'multiplier',
        effect: { scoreMultiplier: 1.5 }
      }
    ],
    difficulty: 'easy',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Tactical Battlefield',
    image: '/maps/tactical-battlefield.png',
    themeColor: '#FF5722',
    gridSize: {
      width: 10,
      height: 3
    },
    specialSquares: [
      {
        position: { x: 2, y: 1 },
        type: 'bonus',
        effect: { scoreBonus: 3 }
      },
      {
        position: { x: 7, y: 1 },
        type: 'bonus',
        effect: { scoreBonus: 3 }
      },
      {
        position: { x: 5, y: 1 },
        type: 'multiplier',
        effect: { scoreMultiplier: 2.0 }
      }
    ],
    difficulty: 'medium',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Strategic Colosseum',
    image: '/maps/strategic-colosseum.png',
    themeColor: '#2196F3',
    gridSize: {
      width: 10,
      height: 3
    },
    specialSquares: [
      {
        position: { x: 3, y: 1 },
        type: 'multiplier',
        effect: { scoreMultiplier: 1.5 }
      },
      {
        position: { x: 6, y: 1 },
        type: 'multiplier',
        effect: { scoreMultiplier: 1.5 }
      },
      {
        position: { x: 5, y: 1 },
        type: 'restricted',
        effect: { cannotPlace: true }
      }
    ],
    difficulty: 'hard',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Grandmaster\'s Court',
    image: '/maps/grandmaster-court.png',
    themeColor: '#9C27B0',
    gridSize: {
      width: 10,
      height: 5
    },
    specialSquares: [
      {
        position: { x: 5, y: 2 },
        type: 'special',
        effect: { scoreMultiplier: 3.0 }
      },
      {
        position: { x: 2, y: 1 },
        type: 'multiplier',
        effect: { scoreMultiplier: 1.5 }
      },
      {
        position: { x: 7, y: 1 },
        type: 'multiplier',
        effect: { scoreMultiplier: 1.5 }
      },
      {
        position: { x: 2, y: 3 },
        type: 'multiplier',
        effect: { scoreMultiplier: 1.5 }
      },
      {
        position: { x: 7, y: 3 },
        type: 'multiplier',
        effect: { scoreMultiplier: 1.5 }
      }
    ],
    difficulty: 'expert',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const seedMaps = async () => {
  try {
    console.log('Attempting to connect to the database...');
    await connectDatabase();

    console.log('Clearing existing maps from the database...');
    const deleteResult = await Map.deleteMany({});
    console.log(`-> Deleted ${deleteResult.deletedCount} maps.`);

    console.log('Inserting new map data...');
    const insertedMaps = await Map.insertMany(maps);
    console.log(`-> Successfully inserted ${insertedMaps.length} maps.`);

  } catch (error) {
    console.error('❌ An error occurred during the map seeding process:');
    console.error(error);
  } finally {
    console.log('Disconnecting from the database...');
    await disconnectDatabase();
  }
};

seedMaps();
