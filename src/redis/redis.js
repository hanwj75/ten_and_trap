import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();
const env = process.env;
const redisClient = new Redis({
  host: env.REDIS_HOST, // Redis 클라우드 호스트
  port: env.REDIS_PORT, // Redis 클라우드 포트
  //password: env.REDIS_PASSWORD, // Redis 클라우드 비밀번호
});
redisClient.on('error', (err) => {
  console.error('Redis error: ', err);
});
export const connectRedis = async (key, val, ex) => {
  console.log(`Redis connected!`);
  if (!redisClient.status) {
    await redisClient.connect();
    console.log(`Redis connected!`);
  }
};
await connectRedis();
// 데이터 저장 / 사용예시 : setRedis("홍길동","퇴근시간",3600)
const setRedis = async (key, val, ex) => {
  await redisClient.set(key, val, 'EX', ex);
};
// 데이터 조회 / 사용예시 : getRedis("홍길동")
const getRedis = async (key) => {
  await redisClient.get(key);
};
// 순위 1~7등
// 레디스를 사용해서 나갈때마다 저장했다가 메인DB로 ㄱㄱ
//
// 순위가 높을수록 점수를 많이주는거임
// if(true) {
//   desc
// } else {
//   asc
// }
// 1,2,3,4,5,6,7 =>
// 1,2,3, => 파산하면 7 승리조건을 맞추면 1
// 1,2,3,4
//승리시 승리스택에 쌓음
//패배시 패배스택에 쌓음
//[1,2,3]승리 1~3 순으로
//push로 쌓기
//[4,5,6,7]패배 7~4 순으로
//shift로 쌓기
//게임종료후 concat으로 스택 합치기

// import { createClient } from 'redis';
// import dotenv from 'dotenv';
// import envFiles from '../constants/env.js';

// dotenv.config();

// /**
//  * 레디스 클라이언트 설정
//  */
// const redisClient = createClient({
//   //   url: `redis://${REDIS_USERNAME}:${REDIS_USERPASS}@${REDIS_HOST}:${REDIS_PORT}/0`,
//   socket: {
//     host: envFiles.redis.REDIS_HOST,
//     port: envFiles.redis.REDIS_PORT,
//   },
//   password: envFiles.redis.REDIS_PASSWORD,
// });

// /**
//  * 레디스 클라이언트 초기화
//  */
// export const initRedisClient = async () => {
//   redisClient.on('error', (err) => {
//     console.log('Redis Client Error', err);
//   });

//   await redisClient.connect();

//   console.log(' =init_RedisClient= ');
// };

// export default redisClient;
