import Redis from 'ioredis';
import dotenv from 'dotenv';
import { dbConfig } from '../../config/dbconfig.js';
import { createRecord } from '../../db/record/record.db.js';

dotenv.config();
const env = dbConfig.redis;

const ROOM_ID = 'Room Id';
const ROOMS = 'rooms';
const redisClient = new Redis({
  host: env.host, // Redis 클라우드 호스트
  port: env.port, // Redis 클라우드 포트
  password: env.password, // Redis 클라우드 비밀번호
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

export const redis = {
  // 데이터 저장 / 사용예시 : setRedis("홍길동","퇴근시간",3600)
  setRedis: async (key, val, ex) => {
    if (ex) {
      return await redisClient.set(key, val, 'EX', ex);
    } else {
      return await redisClient.set(key, val);
    }
  },
  // 데이터 조회 / 사용예시 : getRedis("홍길동")
  getRedis: async (key) => {
    return await redisClient.get(key);
  },

  // 여러 데이터 저장
  saddRedis: async (key, ...val) => {
    return await redisClient.sadd(key, ...val);
  },

  //순위 저장

  recordRedis: async (win, lose) => {
    //승리 스택 저장(push)
    await redisClient.rpush('win', ...win);
    //패배 스택 저장(shift)
    await redisClient.lpush('lose', ...lose);
  },

  //게임 종료 후 결과 저장
  gameResultRedis: async () => {
    const winner = await redisClient.lrange('win', 0, -1);
    const losers = await redisClient.lrange('lose', 0, -1);
    //최종 결과 합치기
    //패배는 역순으로 저장
    const resultConcatRedis = [...winner, ...losers.reverse()];
    //최종 결과를 DB에 저장
    await createRecord('userId', resultConcatRedis);

    //redis 스택 초기화
    await redisClient.del('winners');
    await redisClient.del('losers');
  },

  //유저 정보를 해시로 저장하기
  hSetRedis: async (key, val) => {
    await redisClient.hset(key, val);
    return user;
  },

  /**
   * @desc 유저를 룸 세션에서 관리하는부분
   * @todo
   * 1.유저의 세션을 배열로 만든다
   * 2.룸 세션도 배열로 만든다.
   * 3.룸의 키값은 uuid로 한다.
   * 4.룸세션은 유저 세션에 들어온 유저만 들어올 수 있다.
   * 5.maxUserNum <= 룸 세션 길이 라면 게임 준비 or 시작가능
   *
   */
  // 1
  //유저를 룸에 넣어줌

  addRoomToUser: async (roomId, userId) => {
    try {
      const key = `${ROOM_ID}:${roomId}`;
      await redisClient.sadd(key, userId);
      await redisClient.expire(key, 3600);
    } catch (err) {
      console.error('Redis error: ', err);
    }
  },
  //룸 ID를 담은 rooms배열
  addRoomsToRoom: async (rooms, roomId) => {
    try {
      const key = `${ROOMS}:${rooms}`;
      await redisClient.sadd(key, roomId);
      await redisClient.expire(key, 3600);
    } catch (err) {
      console.error('Redis error: ', err);
    }
  },
  //유저가 나간다면 룸에서 삭제
  removeUser: async (roomId, userId) => {
    try {
      await redisClient.srem(`${ROOM_ID}:${roomId}`, userId);
    } catch (err) {
      console.error('Redis error: ', err);
    }
  },
  //게임 종료시 룸 삭제
  deleteSession: async (roomId) => {
    try {
      await redisClient.del(`${ROOM_ID}:${roomId}`);
    } catch (err) {
      console.error('Redis error: ', err);
    }
  },

  //레디스 sadd배열 키값으로 조회하기
  getRedisSadd: async (key) => {
    try {
      const members = await redisClient.smembers(key);
      return members;
    } catch (err) {
      console.error('Redis error: ', err);
    }
  },

  // 키값으로 레디스 데이터 삭제하기
  delRedisByKey: async (key) => {
    try {
      await redisClient.del(key);
    } catch (err) {
      console.error(err);
    }
  },
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
