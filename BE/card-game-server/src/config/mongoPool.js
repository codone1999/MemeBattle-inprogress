import mongoose from 'mongoose';

const poolConfig = {
  development: {
    maxPoolSize: 10,
    minPoolSize: 5,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  },
  production: {
    maxPoolSize: 50,
    minPoolSize: 10,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    ssl: true,
    retryWrites: true,
    w: 'majority',
  },
  test: {
    maxPoolSize: 5,
    minPoolSize: 2,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 15000,
  }
};

function getPoolConfig() {
  const env = process.env.NODE_ENV || 'development';
  return poolConfig[env] || poolConfig.development;
}

export default { getPoolConfig };