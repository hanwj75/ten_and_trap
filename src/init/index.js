// src/init/index.js

import { connectRedis } from '../redis/redis.js';
import testConnection from '../utils/db/testConnection.js';
import { loadProtos } from './loadProto.js';

const initServer = async () => {
  try {
    await loadProtos();
    await connectRedis();
    await testConnection();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

export default initServer;
