import { CharacterStateType } from '../../../init/loadProto.js';
import { redis } from '../../../init/redis/redis.js';
import { handleError } from '../../../utils/error/errorHandler.js';
/**
 * @dest 상대방버리기 카드 사용
 * @author 박건순
 *
 */

export const throwAwayAll = async (userData, roomData) => {
  try {
    if (!userData || !roomData) {
      throw new CustomError(ErrorCodes.INVALID_REQUEST, `유효하지 않은 유저 데이터 또는 방 데이터 입니다.`);
    }

    const user = userData;
    const allUsers = roomData.users;
    const shooterState = {
      state: CharacterStateType.values.GUERRILLA_SHOOTER,
      nextState: 0,
      nextStateAt: 1000,
      stateTargetUserId: user.id,
    };
    const targetState = {
      state: CharacterStateType.values.GUERRILLA_TARGET,
      nextState: 0,
      nextStateAt: 1000,
      stateTargetUserId: user.id,
    };
    user.stateInfo = shooterState;

    allUsers.forEach((opponent) => {
      const curOpponent = opponent;
      let opponentHand = curOpponent.character.handCards;
      let opponentCount = curOpponent.character.handCardsCount;
      // 무효 있는지 없는지 체크
      const existShield = opponentHand.find((card) => card.type === 3);
      if (existShield) {
        //실드 있다면 나중에 reactionHandler에서 적용
        console.log('i have shield');
      } else {
        const randomIndex = Math.floor(Math.random() * opponentCount);

        if (opponentHand[randomIndex]) {
          opponentHand[randomIndex].count--;
          if (opponentHand[randomIndex].count <= 0) {
            opponentHand.splice(randomIndex, 1);
          }
          opponentCount--;
        }
      }

      // redis에 상대 유저 정보 업데이트
      const updateRoomData = roomData.users.find((user) => user.id == curOpponent.id);
      const updateCharacter = updateRoomData.character;
      updateCharacter.handCards = opponentHand;
      updateCharacter.handCardsCount = opponentCount;
      updateRoomData.character.stateInfo = targetState;

      const handCards = JSON.stringify(opponentHand);
      const updatedOpponentData = {
        ...opponent,
        stateInfo: JSON.stringify(targetState),
        handCards,
        handCardsCount: opponentCount,
      };
      redis.addRedisToHash(`user:${curOpponent.id}`, updatedOpponentData);
    });

    const users = JSON.stringify(roomData.users);
    const updatedRoomData = { ...roomData, users };
    await redis.addRedisToHash(`room:${roomData.id}`, updatedRoomData);

    return user;
  } catch (err) {
    handleError(null, err);
  }
};
