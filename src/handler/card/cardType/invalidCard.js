import { stateInitData } from '../../../init/initData.js';
import { redis } from '../../../init/redis/redis.js';

/**
 * @dest 실드 카드 사용
 * @author 박건순
 *
 */

export const invalidCard = async (userData, opponentData, roomData) => {
  const user = userData;
  user.stateInfo = JSON.parse(user.stateInfo);
  user.stateInfo = JSON.stringify(stateInitData);

  const opponent = opponentData;
  // redis에 상대 유저 정보 업데이트
  const updateRoomData = roomData.users.find((user) => user.id == opponent.id);
  updateRoomData.character.stateInfo = stateInitData;
  const updatedRoomData = { ...roomData, users: JSON.stringify(roomData.users) };
  await redis.addRedisToHash(`room:${roomData.id}`, updatedRoomData);

  const updatedOpponentData = {
    ...opponent,
    stateInfo: JSON.stringify(stateInitData),
  };
  await redis.addRedisToHash(`user:${opponent.id}`, updatedOpponentData);

  return user;
};
