import { packetType } from '../../constants/header.js';
import { GlobalFailCode } from '../../init/loadProto.js';
import { createResponse } from '../../utils/response/createResponse.js';

export const gameStartHandler = (socket) => {
  try {
    const responsePayload = {
      gameStartResponse: {
        success: true,
        failCode: GlobalFailCode.values.NONE_FAILCODE,
      },
    };

    const notificationPayload = {
      gameStartNotification: {
        gameState: 2,
        users: '',
        characterPositions: '',
      },
    };

    const response = createResponse(responsePayload, packetType.GAME_START_RESPONSE, 0);

    const notification = createResponse(notificationPayload, packetType.GAME_START_NOTIFICATION, 0);

    socket.write(response);

    // notification 쏘기
  } catch (error) {
    console.error(error);
  }
};
