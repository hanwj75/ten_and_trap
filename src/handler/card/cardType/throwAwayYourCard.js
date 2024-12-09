import { redis } from '../../../init/redis/redis.js';
import { handleError } from '../../../utils/error/errorHandler.js';
/**
 * @dest 상대방버리기 카드 사용
 * @author 박건순
 *
 */

export const throwAwayYourCard = async (opponentData, roomData) => {
  try {
    const opponent = opponentData;
    const opponentHand = JSON.parse(opponent.handCards);
    let opponentCount = opponent.handCardsCount;

    const randomIndex = Math.floor(Math.random() * opponentCount);

    if (opponentHand[randomIndex]) {
      opponentHand[randomIndex].count--;
      if (opponentHand[randomIndex].count <= 0) {
        opponentHand.splice(randomIndex, 1);
      }
      opponentCount--;
    }

    // redis에 상대 유저 정보 업데이트
    const updateRoomData = roomData.users.find((user) => user.id == opponent.id);
    const updateCharacter = updateRoomData.character;
    updateCharacter.handCards = opponentHand;
    updateCharacter.handCardsCount = opponentCount;

    const users = JSON.stringify(roomData.users);
    const updatedRoomData = { ...roomData, users };
    await redis.addRedisToHash(`room:${roomData.id}`, updatedRoomData);

    const handCards = JSON.stringify(opponentHand);
    const updatedOpponentData = { ...opponent, handCards, handCardsCount: opponentCount };
    await redis.addRedisToHash(`user:${opponent.id}`, updatedOpponentData);

    return opponentData;
  } catch (err) {
    handleError(null, err);
  }
};
