import { connectRedis } from './redis/redis.js';
import { loadProtos } from './loadProto.js';
import testAllConnections from '../utils/db/testConnection.js';
import pools from '../db/database.js';

const initServer = async () => {
  try {
    await loadProtos();
    await connectRedis();
    await testAllConnections(pools);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

export default initServer;
