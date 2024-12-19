import { CharacterStateType } from '../../../init/loadProto.js';
import { redis } from '../../../init/redis/redis.js';
import { handleError } from '../../../utils/error/errorHandler.js';
/**
 * @dest 상대방 모든 카드 버리기 사용
 * @author 박건순
 *
 */

export const throwAwayYourAllCard = async (userData, opponentData, roomData) => {
  try {
    if (!userData || !opponentData || !roomData) {
      throw new CustomError(ErrorCodes.INVALID_REQUEST, `유효하지 않은 유저 데이터 또는 방 데이터 입니다.`);
    }

    const user = userData;
    const opponent = opponentData;
    let opponentHand = JSON.parse(opponent.handCards);
    let opponentCount = opponent.handCardsCount;

    const shooterState = {
      state: CharacterStateType.values.BBANG_SHOOTER,
      nextState: 0,
      nextStateAt: 1000,
      stateTargetUserId: opponent.id,
    };
    const targetState = {
      state: CharacterStateType.values.THROW_AWAY_ALL_TARGET,
      nextState: 0,
      nextStateAt: 1000,
      stateTargetUserId: user.id,
    };
    user.stateInfo = shooterState;

    const existShield = opponentHand.find((card) => card.type === 3);
    if (existShield) {
      //실드 있다면 나중에 reactionHandler에서 적용
      // console.log('i have shield');
    } else {
      opponentHand = [];
      opponentCount = 0;
    }

    // redis에 상대 유저 정보 업데이트
    const updateRoomData = roomData.users.find((user) => user.id == opponent.id);
    const updateCharacter = updateRoomData.character;
    updateCharacter.handCards = opponentHand;
    updateCharacter.handCardsCount = opponentCount;
    updateRoomData.character.stateInfo = targetState;

    const users = JSON.stringify(roomData.users);
    const updatedRoomData = { ...roomData, users };
    await redis.addRedisToHash(`room:${roomData.id}`, updatedRoomData);

    const handCards = JSON.stringify(opponentHand);
    const updatedOpponentData = {
      ...opponent,
      stateInfo: JSON.stringify(targetState),
      handCards,
      handCardsCount: opponentCount,
    };
    await redis.addRedisToHash(`user:${opponent.id}`, updatedOpponentData);

    return user;
  } catch (err) {
    handleError(null, err);
  }
};
