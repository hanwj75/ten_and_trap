import Redis from 'ioredis';
import dotenv from 'dotenv';
import { dbConfig } from '../../config/dbconfig.js';
import { createRecord } from '../../db/record/record.db.js';

dotenv.config();
const env = dbConfig.redis;

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

  // 데이터 해시로 저장
  addRedisToHash: async (key, val) => {
    return await redisClient.hset(key, ...Object.entries(val).flat());
  },

  // 방에 방장 찾기
  getRoomByUserId: async (key, val) => {
    // 방 정보가 해시로 저장되어 있는지 확인
    const roomValue = await redisClient.hget(key, val);

    if (roomValue === null) {
      console.error(`해당 키에 대한 방 정보가 없습니다: ${key}`);
      return null;
    }

    return roomValue;
  },

  // 방의 사용자 목록을 Redis에 저장하는 함수
  updateUsersToRoom: async (key, fiedl, val) => {
    // Redis에 사용자 목록 저장
    await redisClient.hset(`room:${key}`, fiedl, JSON.stringify(val));
    console.log(`사용자 목록이 방 ${key}에 저장되었습니다.`);
  },

  // 방에 해당하는 모든 키 가져오기
  getRoomKeys: async (pattern) => {
    const keys = [];
    let cursor = '0'; // SCAN의 커서 초기값

    do {
      // SCAN을 사용하여 키를 가져옴
      //cursor = 다음 스캔 시작 위치 , 처음호출시 0
      //MATCH pattern = 특정 패턴에 따른 키 필터링 , 예시:room:*
      //COUNT 100 = 한번의 스캔에서 반환할 키의 대략적인 수 지정
      const result = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = result[0]; // 다음 커서 업데이트
      keys.push(...result[1]); // 가져온 키를 배열에 추가
    } while (cursor !== '0'); // 커서가 0이 아닐 때까지 반복

    return keys; // 모든 키 반환
  },

  // 필드 값으로 키 찾기
  findRoomKeyToField: async (keys, field, fieldvalue) => {
    for (const key of keys) {
      const value = await redisClient.hget(key, field);
      if (value == fieldvalue) {
        return key;
      }
    }
    return null;
  },
  // 해당키값의 모든 필드 가져오기
  getAllFieldsFromHash: async (key) => {
    const hashData = await redisClient.hgetall(key); // 모든 필드와 값을 가져옴

    if (!hashData) {
      console.error(`해시가 존재하지 않습니다: ${key}`);
      return null; // 해시가 존재하지 않을 때 null 반환
    }

    return hashData; // 해시의 모든 필드와 값을 반환
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
