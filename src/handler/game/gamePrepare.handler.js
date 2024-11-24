import { packetType } from '../../constants/header.js';
import { GlobalFailCode } from '../../init/loadProto.js';
import { redis } from '../../init/redis/redis.js';
import { getUserById, getUserBySocket, getUserByUserId } from '../../sessions/user.session.js';
import { createResponse } from '../../utils/response/createResponse.js';

export const gamePrepareHandler = async (socket) => {
  try {
    // request한 socket사용해서 session에서 방장 정보 조회
    const owner = await getUserBySocket(socket);

    // redis에서 room 조회
    const room = await redis.getAllFieldsFromHash(`room:${owner.id}`);

    // 현재 호스트와 redis ownerId field의 id 대조
    if (+owner.id !== +room.ownerId) {
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

    // 최소 인원수 점검
    // if (users.length < 4) {
    // }

    // response
    const responsePayload = {
      gamePrepareResponse: {
        success: true,
        failCode: GlobalFailCode.values.NONE_FAILCODE,
      },
    };
    const response = createResponse(responsePayload, packetType.GAME_PREPARE_RESPONSE, 0);
    socket.write(response);

    // // redis에 state 0 => 1 update
    await redis.updateRoomState(`room:${owner.id}`, 1);

    const updatedRoom = await redis.getAllFieldsFromHash(`room:${owner.id}`);

    const users = JSON.parse(updatedRoom.users);

    const notificationPayload = {
      gamePrepareNotification: {
        room: updatedRoom,
      },
    };

    const notification = createResponse(
      notificationPayload,
      packetType.GAME_PREPARE_NOTIFICATION,
      0,
    );

    // Notification
    users.forEach((user) => {
      const targetUser = getUserById(+user.id);
      targetUser.socket.write(createResponse(notification));
    });
  } catch (error) {
    console.error(error);
  }
};
