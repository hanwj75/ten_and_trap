import { packetType } from '../../constants/header.js';
import { GlobalFailCode } from '../../init/loadProto.js';
import { redis } from '../../init/redis/redis.js';
import { createResponse } from '../../utils/response/createResponse.js';

export const gameStartHandler = async (socket) => {
  try {
    // request한 socket사용해서 session에서 방장 정보 조회
    const owner = await getUserBySocket(socket);

    // redis에서 room 조회
    const room = await redis.getAllFieldsFromHash(`room:${owner.id}`);

    // 현재 호스트와 redis ownerId field의 id 대조
    if (owner.id !== room.ownerId) {
      const responsePayload = {
        gameStartResponse: {
          success: false,
          failCode: GlobalFailCode.values.NOT_ROOM_OWNER,
        },
      };
      const response = createResponse(responsePayload, packetType.GAME_START_RESPONSE, 0);
      socket.write(response);
      return;
    }

    // response
    const responsePayload = {
      gameStartResponse: {
        success: true,
        failCode: GlobalFailCode.values.NONE_FAILCODE,
      },
    };
    const response = createResponse(responsePayload, packetType.GAME_START_RESPONSE, 0);
    socket.write(response);
  } catch (error) {
    console.error(error);
  }
};
