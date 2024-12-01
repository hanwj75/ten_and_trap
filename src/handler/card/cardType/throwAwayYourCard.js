import { redis } from '../../../init/redis/redis.js';
import CustomError from '../../../utils/error/customError.js';
import { ErrorCodes } from '../../../utils/error/errorCodes.js';
import { handleError } from '../../../utils/error/errorHandler.js';

export const throwAwayYourCard = async (opponentData, roomData) => {
  try {
    const opponent = opponentData;
    const opponentHand = JSON.parse(opponent.handCards);
    let opponentCount = opponent.handCardsCount;

    //상대방 카드가 없는 경우
    if (!opponentHand || opponentHand.length === 0) {
      throw new CustomError(ErrorCodes.CHARACTER_NO_CARD, `상대방의 손에 카드가 없습니다.`);
    }

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
    if (!updateRoomData) {
      throw new CustomError(ErrorCodes.CHARACTER_NOT_FOUND, `방에 상대방 정보가 없습니다.`);
    }
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
