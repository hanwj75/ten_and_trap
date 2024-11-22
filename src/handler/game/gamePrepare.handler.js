import { packetType } from '../../constants/header.js';
import { GlobalFailCode } from '../../init/loadProto.js';
import { redis } from '../../init/redis/redis.js';
import { getUserBySocket } from '../../sessions/user.session.js';
import { createResponse } from '../../utils/response/createResponse.js';

export const gamePrepareHandler = async (socket) => {
  try {
    // request한 socket사용해서 session에서 방장 정보 조회
    const owner = await getUserBySocket(socket);

    // redis에서 room 조회
    const room = await redis.getAllFieldsFromHash(`room:${owner.id}`);

    // 현재 호스트와 redis ownerId field의 id 대조
    if (owner.id !== room.ownerId) {
      const responsePayload = {
        gamePrepareResponse: {
          success: false,
          failCode: GlobalFailCode.values.NOT_ROOM_OWNER,
        },
      };
      const response = createResponse(responsePayload, packetType.GAME_PREPARE_RESPONSE, 0);
      socket.write(response);
      return;
    }

    // response
    const responsePayload = {
      gamePrepareResponse: {
        success: true,
        failCode: GlobalFailCode.values.NONE_FAILCODE,
      },
    };
    const response = createResponse(responsePayload, packetType.GAME_PREPARE_RESPONSE, 0);
    socket.write(response);

    // // redis에 저장
    const stateUpdatedRoom = await redis.updateRoomState(owner.id, 1);

    const notificationPayload = {
      gamePrepareNotification: {
        room: stateUpdatedRoom,
      },
    };

    const notification = createResponse(
      notificationPayload,
      packetType.GAME_PREPARE_NOTIFICATION,
      0,
    );

    // host 제외한 유저들에게 notification
    users.forEach(async (user) => {
      if (user.id !== owner.id) {
        const userSocket = await getUserBySocket(user.socket);
        userSocket.write(notification);
      }
    });
  } catch (error) {
    console.error(error);
  }
};
