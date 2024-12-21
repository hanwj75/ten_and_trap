import { PACKET_TYPE } from '../../constants/header.js';
import { getGameById, switchOn } from '../../sessions/game.session.js';
import { getUserBySocket, findUsersByJoinRoom } from '../../sessions/user.session.js';
import CustomError from '../../utils/error/customError.js';
import { ErrorCodes } from '../../utils/error/errorCodes.js';
import { handleError } from '../../utils/error/errorHandler.js';
import { sendNotificationToUsers } from '../../utils/notifications/notification.js';

/**
 * @desc 캐릭터 위치 동기화
 * @author 한우종
 * @todo 캐릭터 위치 이동시 전체한테 notification
 */
export const positionUpdateHandler = async (socket, payload) => {
  try {
    const { x, y } = payload.positionUpdateRequest;
    const positions = { x, y };

    const user = await getUserBySocket(socket);
    if (!user) {
      throw new CustomError(ErrorCodes.UNKNOWN_ERROR, `존재하지 않는 유저입니다.`);
    }

    // 현재 사용자의 위치 갱신
    let game = await getGameById(user.joinRoom);
    const currentUserPosition = { id: user.id, x: positions.x, y: positions.y };
    game.userPositions = [...game.userPositions, currentUserPosition];

    // 스위치 켜졌을 때만 notification 보내기
    if (game.positionUpdateSwitch == true) {
      let users = await findUsersByJoinRoom(user.joinRoom);
      const notification = { positionUpdateNotification: { characterPositions: game.userPositions } };
      sendNotificationToUsers(users, notification, PACKET_TYPE.POSITION_UPDATE_NOTIFICATION, 0);
      // console.log('Position count');
      game.positionUpdateSwitch = false;
      // 일정 시간마다 스위치 온
      setTimeout(function () {
        switchOn(game.roomId);
      }, 300);
    }
  } catch (err) {
    handleError(socket, err);
  }
};
