/**
 * @desc 캐릭터 위치 동기화
 * @author 한우종
 * @todo 캐릭터 위치 이동시 전체한테 notification
 * 
 * message C2SPositionUpdateRequest {
    double x = 1;
    double y = 2;
}
    message CharacterPositionData {
    int64 id = 1;
    double x = 2;
    double y = 3;
}

message S2CPositionUpdateNotification {
    repeated CharacterPositionData characterPositions = 1;
}
 */

import { packetType } from '../../constants/header.js';
import { redis } from '../../init/redis/redis.js';
import { getUserBySocket } from '../../sessions/user.session.js';
import { sendNotificationToUsers } from '../../utils/notifications/notification.js';

export const positionUpdateHandler = async (socket, payload) => {
  console.log('작동은 하고 있는거임?');
  const { x, y } = payload.positionUpdateRequest;
  const positions = { x, y };

  const user = await getUserBySocket(socket);
  console.log(`🤪 ~ file: positionUpdateHandler.js:32 ~ positionUpdateHandler ~ user:`, user);

  const currenUserRoomId = await redis.getRoomByUserId(`user:${user.id}`, 'joinRoom');
  //현재 방에있는 유저 목록
  const getreadyUser = await redis.getRoomByUserId(`room:${currenUserRoomId}`, 'users');
  //방에 있는 유저
  const users = await JSON.parse(getreadyUser);
  console.log(
    `🤪 ~ file: positionUpdateHandler.js:30 ~ positionUpdateHandler ~ positions:`,
    positions,
  );
  // 현재 사용자의 위치 업데이트
  user.characterPosition = positions; // 사용자 객체에 현재 위치 저장
  console.log(
    `🤪 ~ file: positionUpdateHandler.js:45 ~ positionUpdateHandler ~ user.characterPosition:`,
    user.characterPosition,
  );
  // 모든 사용자 위치 데이터 생성
  const characterPositions = users.map((u) => ({
    id: u.id,
    x: u.characterPosition?.x || 0, // 기존 위치 사용
    y: u.characterPosition?.y || 0,
  }));
  console.log(
    `🤪 ~ file: positionUpdateHandler.js:45 ~ characterPositions ~ characterPositions:`,
    characterPositions,
  );
  // 현재 사용자의 위치 추가
  const currentUserPosition = {
    id: user.id,
    x: positions.x,
    y: positions.y,
  };
  console.log(
    `🤪 ~ file: positionUpdateHandler.js:56 ~ positionUpdateHandler ~ currentUserPosition:`,
    currentUserPosition,
  );
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
};
