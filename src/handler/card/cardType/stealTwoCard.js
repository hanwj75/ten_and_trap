import { redis } from '../../../init/redis/redis.js';
import CustomError from '../../../utils/error/customError.js';
import { ErrorCodes } from '../../../utils/error/errorCodes.js';
import { handleError } from '../../../utils/error/errorHandler.js';
export const stealTwoCard = async (userData, opponentData, roomData) => {
  try {
    if (!userData || !opponentData || !roomData) {
      throw new CustomError(ErrorCodes.INVALID_REQUEST, `유효하지 않은 유저 데이터 또는 방 데이터 입니다.`);
    }

    const user = userData;
    const opponent = opponentData;
    let opponentHand = JSON.parse(opponentData.handCards);
    let handCardsCount = opponentData.handCardsCount;

    //상대방 카드가 없는 경우
    if (!opponentHand || opponentHand.length === 0) {
      throw new CustomError(ErrorCodes.CHARACTER_NO_CARD, `상대방이 가지고 있는 카드가 없습니다.`);
    }
    // 카드 2장 랜덤으로 훔침
    const count = 2;
    const newHandCards = [];

    // 만약 2장이 없다면 다 뺏고 종료
    if (Number(handCardsCount) <= count) {
      [...user.handCards, ...opponentHand].forEach((card) => {
        const existType = newHandCards.find((item) => item.type === card.type);
        if (existType) {
          existType.count += card.count;
        } else {
          newHandCards.push({ type: card.type, count: card.count });
        }
      });
      user.handCards = newHandCards;
      user.handCardsCount += handCardsCount;

      //상대방 카드 초기화
      handCardsCount = 0;
      opponentHand = [];
    } else {
      for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * opponentHand.length);
        const existType = user.handCards.find((card) => card.type === opponentHand[randomIndex].type);

        if (existType) {
          existType.count++;
        } else {
          user.handCards.push({ type: opponentHand[randomIndex].type, count: 1 });
        }
        user.handCardsCount++;
        opponentHand[randomIndex].count--;
        //카드 수가 - 이하일 경우 제거
        if (opponentHand[randomIndex].count <= 0) {
          opponentHand.splice(randomIndex, 1);
        }
        handCardsCount--;
      }
    }

    // redis에 상대 유저 정보 업데이트
    const updateRoomData = roomData.users.find((user) => user.id == opponent.id);
    if (!updateRoomData) {
      throw new CustomError(ErrorCodes.CHARACTER_NOT_FOUND, `상대방 정보가 없습니다.`);
    }

    const users = JSON.stringify(roomData.users);
    const UpdateCharacter = updateRoomData.character;
    UpdateCharacter.handCards = opponentHand;
    UpdateCharacter.handCardsCount = handCardsCount;

    const updatedRoomData = { ...roomData, users };
    await redis.addRedisToHash(`room:${roomData.id}`, updatedRoomData);

    const handCards = JSON.stringify(opponentHand);
    const updatedOpponentData = { ...opponent, handCards, handCardsCount };
    await redis.addRedisToHash(`user:${opponent.id}`, updatedOpponentData);

    return user;
  } catch (err) {
    handleError(null, err);
  }
};
