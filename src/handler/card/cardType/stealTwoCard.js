import { getGameAssets } from '../../../init/assets.js';
import { redis } from '../../../init/redis/redis.js';
import { modifyUserData } from '../../../sessions/user.session.js';
export const stealTwoCard = async (userData, opponentData, roomData) => {
  const { card } = getGameAssets();

  const user = userData;
  const opponent = opponentData;

  // 카드 2장 랜덤으로 훔침
  let count = 2;
  // 만약 2장이 없다면 다 뺏고 종료
  if (opponent.handCardsCount < count) {
    const map = new Map();
    [...user.handCards, ...opponent.handCards].forEach((card) => {
      if (map.has(card.type)) {
        map.set(card.type, map.get(card.type) + card.count);
      } else {
        map.set(card.type, card.count);
      }
    });
    user.handCards = map;
    user.handCardsCount += opponent.handCardsCount;
    opponent.handCardsCount = 0;
    opponent.handCards = [];
  } else {
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * opponent.handCardsCount);
      const existType = user.handCards.find(
        (card) => card.type === opponent.handCards[randomIndex].type,
      );

      if (existType) {
        existType.count++;
      } else {
        user.handCards.push({ type: opponent.handCards[randomIndex].type, count: 1 });
      }
      console.log('test111:' + JSON.stringify(user.handCards));
      console.log('test222:' + JSON.stringify(opponent.handCards));
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
    character: {
      handCards: opponent.handCards,
      handCardsCount: opponent.handCardsCount,
    },
  });

  // redis에 상대 유저 정보 업데이트
  const updateRoomData = roomData.users.find((user) => user.id == opponent.id);
  updateRoomData.character.handCards = opponent.handCards;
  updateRoomData.character.handCardsCount = opponent.handCardsCount;
  const updatedRoomData = {
    ...roomData,
    users: JSON.stringify(roomData.users),
  };
  await redis.addRedisToHash(`room:${roomData.id}`, updatedRoomData);

  const updatedOpponentData = {
    ...opponent,
    handCards: JSON.stringify(opponent.handCards),
    handCardsCount: opponent.handCardsCount,
  };
  await redis.addRedisToHash(`user:${opponent.id}`, updatedOpponentData);

  return user;
};
