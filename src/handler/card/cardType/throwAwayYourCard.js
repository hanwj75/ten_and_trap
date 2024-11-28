import { redis } from '../../../init/redis/redis.js';
import { modifyUserData } from '../../../sessions/user.session.js';

export const throwAwayYourCard = async (opponentData, roomData) => {
  const opponent = opponentData;

  const randomIndex = Math.floor(Math.random() * opponent.handCardsCount);
  opponent.handCards[randomIndex].count--;
  if (opponent.handCards[randomIndex].count <= 0) {
    opponent.handCards.splice(randomIndex, 1);
  }
  opponent.handCardsCount--;

  // TODO 나중에 따로 함수로 만들어서 리팩토링
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
  return opponentData;
};
