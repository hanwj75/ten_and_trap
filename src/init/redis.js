import { createClient } from 'redis';
import dotenv from 'dotenv';
import envFiles from '../constants/env.js';

dotenv.config();

/**
 * 레디스 클라이언트 설정
 */
const redisClient = createClient({
  //   url: `redis://${REDIS_USERNAME}:${REDIS_USERPASS}@${REDIS_HOST}:${REDIS_PORT}/0`,
  socket: {
    host: envFiles.redis.REDIS_HOST,
    port: envFiles.redis.REDIS_PORT,
  },
  password: envFiles.redis.REDIS_PASSWORD,
});

/**
 * 레디스 클라이언트 초기화
 */
export const initRedisClient = async () => {
  redisClient.on('error', (err) => {
    console.log('Redis Client Error', err);
  });

  await redisClient.connect();

  console.log(' =init_RedisClient= ');
};

export default redisClient;
