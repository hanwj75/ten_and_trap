import { CharacterStateType } from '../../../init/loadProto.js';
import { redis } from '../../../init/redis/redis.js';
import CustomError from '../../../utils/error/customError.js';
import { ErrorCodes } from '../../../utils/error/errorCodes.js';
import { handleError } from '../../../utils/error/errorHandler.js';

/**
 * @dest 스틸 2 카드 사용
 * @author 박건순
 *
 */
export const stealTwoCard = async (userData, opponentData, roomData) => {
  try {
    if (!userData || !opponentData || !roomData) {
      throw new CustomError(ErrorCodes.INVALID_REQUEST, `유효하지 않은 유저 데이터 또는 방 데이터 입니다.`);
    }

    const user = userData;
    const opponent = opponentData;
    let opponentHand = opponentData.handCards;
    opponentHand = JSON.parse(opponentHand);
    let opponentCount = opponentData.handCardsCount;

    // 카드 2장 랜덤으로 훔침
    const count = 2;
    const newHandCards = [];

    const shooterState = {
      state: CharacterStateType.values.BBANG_SHOOTER,
      nextState: 0,
      nextStateAt: 1000,
      stateTargetUserId: opponent.id,
    };
    const targetState = {
      state: CharacterStateType.values.BBANG_TARGET,
      nextState: 0,
      nextStateAt: 1000,
      stateTargetUserId: user.id,
    };
    user.stateInfo = shooterState;

    // 무효 있는지 없는지 체크
    const existShield = opponentHand.find((card) => card.type === 3);
    if (existShield) {
      //실드 있다면 나중에 reactionHandler에서 적용
      console.log('i have shield');
    } else {
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
          const randomIndex = Math.floor(Math.random() * opponentHand.length);
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
    }
    // redis에 상대 유저 정보 업데이트
    const updateRoomData = roomData.users.find((user) => user.id == opponent.id);
    updateRoomData.character.handCards = opponentHand;
    updateRoomData.character.handCardsCount = opponentCount;
    updateRoomData.character.stateInfo = JSON.stringify(targetState);
    const updatedRoomData = { ...roomData, users: JSON.stringify(roomData.users) };
    await redis.addRedisToHash(`room:${roomData.id}`, updatedRoomData);

    const updatedOpponentData = {
      ...opponent,
      stateInfo: JSON.stringify(targetState),
      handCards: JSON.stringify(opponentHand),
      handCardsCount: opponentCount,
    };
    await redis.addRedisToHash(`user:${opponent.id}`, updatedOpponentData);
    return user;
  } catch (err) {
    handleError(null, err);
  }
};
