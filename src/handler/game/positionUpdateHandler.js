import { packetType } from '../../constants/header.js';
import {
  getUserBySocket,
  modifyUserData,
  findUsersByJoinRoom,
} from '../../sessions/user.session.js';
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

    // 현재 사용자의 위치 업데이트
    user.characterPosition = positions; // 사용자 객체에 현재 위치 저장

    // Session에 유저 위치정보 업데이트
    modifyUserData(user.id, { characterPosition: positions });

    let users = await findUsersByJoinRoom(user.joinRoom);

    // console.log('1', users[0].characterPosition, '2', users[1].characterPosition);
    // 모든 사용자 위치 데이터 생성
    const characterPositions = users.map((u) => ({
      id: u.id,
      x: u.characterPosition.x,
      y: u.characterPosition.y,
    }));

    // 현재 사용자의 위치 추가
    const currentUserPosition = {
      id: user.id,
      x: positions.x,
      y: positions.y,
    };

    const positionUpdateNotificationPayload = {
      positionUpdateNotification: {
        characterPositions: [...characterPositions, currentUserPosition],
      },
    };

    sendNotificationToUsers(
      users,
      positionUpdateNotificationPayload,
      packetType.POSITION_UPDATE_NOTIFICATION,
      0,
    );
  } catch (err) {
    console.error(`위치 동기화 에러`, err);
  }
};
