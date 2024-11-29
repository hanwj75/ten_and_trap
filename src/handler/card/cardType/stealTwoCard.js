import { getGameAssets } from '../../../init/assets.js';
import { redis } from '../../../init/redis/redis.js';
import { modifyUserData, getUserById } from '../../../sessions/user.session.js';
export const stealTwoCard = async (userData, opponentData, roomData) => {
  const { card } = getGameAssets();

  const user = userData;
  const opponent = opponentData;
  let opponentHand = opponentData.handCards;
  opponentHand = JSON.parse(opponentHand);
  let opponentCount = opponentData.handCardsCount;
  // 카드 2장 랜덤으로 훔침
  const count = 2;
  const newHandCards = [];

  // 만약 2장이 없다면 다 뺏고 종료

  if (Number(opponentCount) <= count) {
    [...user.handCards, ...opponentHand].forEach((card) => {
      const existType = newHandCards.find((item) => item.type === card.type);
      if (existType) {
        existType.count += card.count;
      } else {
        newHandCards.push({ type: card.type, count: 1 });
      }
    });
    user.handCards = newHandCards;
    user.handCardsCount += opponentCount;
    opponentCount = 0;
    opponentHand = [];
  } else {
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * opponentCount);
      const existType = user.handCards.find((card) => card.type === opponentHand[randomIndex].type);

      if (existType) {
        existType.count++;
      } else {
        user.handCards.push({ type: opponentHand[randomIndex].type, count: 1 });
      }
      user.handCardsCount++;
      opponentHand[randomIndex].count--;
      if (opponentHand[randomIndex].count <= 0) {
        opponentHand.splice(randomIndex, 1);
      }
      opponentCount--;
    }
  }

  // redis에 상대 유저 정보 업데이트
  const updateRoomData = roomData.users.find((user) => user.id == opponent.id);
  updateRoomData.character.handCards = opponentHand;
  updateRoomData.character.handCardsCount = opponentCount;
  const updatedRoomData = { ...roomData, users: JSON.stringify(roomData.users) };
  await redis.addRedisToHash(`room:${roomData.id}`, updatedRoomData);

  const updatedOpponentData = { ...opponent, handCards: JSON.stringify(opponentHand), handCardsCount: opponentCount };
  await redis.addRedisToHash(`user:${opponent.id}`, updatedOpponentData);

  return user;
};
