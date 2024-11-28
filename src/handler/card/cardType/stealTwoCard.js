import { getGameAssets } from '../../../init/assets.js';
import { redis } from '../../../init/redis/redis.js';
import { modifyUserData } from '../../../sessions/user.session.js';
export const stealTwoCard = async (userData, opponentData, roomData) => {
  const { card } = getGameAssets();

  const user = userData;
  const opponent = opponentData;

  // 카드 2장 랜덤으로 훔침
  const count = 2;
  const newHandCards = [];

  // 만약 2장이 없다면 다 뺏고 종료
  if (Number(opponent.handCardsCount) <= count) {
    [...user.handCards, ...opponent.handCards].forEach((card) => {
      const existType = newHandCards.find((item) => item.type === card.type);
      if (existType) {
        existType.count += card.count;
      } else {
        newHandCards.push({ type: card.type, count: 1 });
      }
    });
    user.handCards = newHandCards;
    user.handCardsCount += opponent.handCardsCount;
    opponent.handCardsCount = 0;
    opponent.handCards = [];
  } else {
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * opponent.handCardsCount);
      const existType = user.handCards.find((card) => card.type === opponent.handCards[randomIndex].type);

      if (existType) {
        existType.count++;
      } else {
        user.handCards.push({ type: opponent.handCards[randomIndex].type, count: 1 });
      }
      user.handCardsCount++;
      opponent.handCards[randomIndex].count--;
      if (opponent.handCards[randomIndex].count <= 0) {
        opponent.handCards.splice(randomIndex, 1);
      }
      opponent.handCardsCount--;
    }
  }
  // Session에 상대유저 정보 업데이트
  await modifyUserData(Number(opponent.id), {
    character: { handCards: opponent.handCards, handCardsCount: opponent.handCardsCount },
  });

  // redis에 상대 유저 정보 업데이트
  const updateRoomData = roomData.users.find((user) => user.id == opponent.id);
  updateRoomData.character.handCards = opponent.handCards;
  updateRoomData.character.handCardsCount = opponent.handCardsCount;
  const updatedRoomData = { ...roomData, users: JSON.stringify(roomData.users) };
  await redis.addRedisToHash(`room:${roomData.id}`, updatedRoomData);

  const updatedOpponentData = {
    ...opponent,
    handCards: JSON.stringify(opponent.handCards),
    handCardsCount: opponent.handCardsCount,
  };
  await redis.addRedisToHash(`user:${opponent.id}`, updatedOpponentData);

  return user;
};
