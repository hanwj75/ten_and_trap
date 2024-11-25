import { connectRedis, redis } from './redis/redis.js';
import { loadProtos } from './loadProto.js';
import testAllConnections from '../utils/db/testConnection.js';
import pools from '../db/database.js';

const initServer = async () => {
  try {
    await loadProtos();
    await connectRedis();
    await redis.allDateDel(); //서버 재실행시 데이터 전부 삭제
    await testAllConnections(pools);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

export default initServer;
