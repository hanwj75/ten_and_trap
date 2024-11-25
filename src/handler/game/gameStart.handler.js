import { packetType } from '../../constants/header.js';
import { GlobalFailCode } from '../../init/loadProto.js';
import { redis } from '../../init/redis/redis.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { setSpawnPoints } from '../../utils/setSpawnPoint.js';

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

    console.log('test');

    // 최소 인원수 점검
    // if (users.length < 4) {
    // }

    // response
    const responsePayload = {
      gameStartResponse: {
        success: true,
        failCode: GlobalFailCode.values.NONE_FAILCODE,
      },
    };

    const response = createResponse(responsePayload, packetType.GAME_START_RESPONSE, 0);
    socket.write(response);

    const users = JSON.parse(updatedRoom.users);

    const gameStateData = {
      phaseType: 1,
      nextPhaseAt: '',
    };

    const userData = users.map((user) => {
      return { id: user.id, nickname: user.nickname, character: user.character };
    });

    const characterPositionData = setSpawnPoints(users.length);

    const notificationPayload = {
      gamePrepareNotification: {
        gameState: gameStateData,
        users: userData,
        characterPositions: characterPositionData,
      },
    };

    const notification = createResponse(notificationPayload, packetType.GAME_START_NOTIFICATION, 0);

    users.forEach((user) => {
      const targetUser = getUserById(+user.id);
      targetUser.socket.write(createResponse(notification));
    });
  } catch (error) {
    console.error(error);
  }
};
