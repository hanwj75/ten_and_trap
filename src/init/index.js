import { connectRedis, redis } from './redis/redis.js';
import { loadProtos } from './loadProto.js';
import testAllConnections from '../utils/db/testConnection.js';
import pools from '../db/database.js';
import { loadGameAssets } from './assets.js';
import { initBull } from './redis/bull/bull.js';

const initServer = async () => {
  try {
    await loadProtos();
    await loadGameAssets();
    await connectRedis();
    await redis.allRedisDateDel(); //서버 재실행시 데이터 전부 삭제
    await initBull();
    // await testAllConnections(pools);
  } catch (err) {
    console.error(`initServer 에러`, err);
    process.exit(1);
  }
};

export default initServer;
