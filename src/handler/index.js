import { PACKET_TYPE } from '../constants/header.js';
import { loginHandler } from './user/loginHandler.js';
import { registerHandler } from './user/registerHandler.js';
import { useCardHandler } from './card/useCardHandler.js';

import { gamePrepareHandler, gameStartHandler } from './game/gameStateHandler.js';
import { positionUpdateHandler } from './game/positionUpdateHandler.js';
import { createRoomHandler } from './room/createRoomHandler.js';
import { getRoomListHandler } from './room/roomlistHandler.js';
import { joinRoomHandler } from './room/joinRoomHandler.js';
import { joinRandomRoomHandler } from './room/randomMatchHandler.js';
import { leaveRoomHandler } from './room/leaveRoomHandler.js';

const handlers = {
  // 회원가입 및 로그인
  [PACKET_TYPE.REGISTER_REQUEST]: {
    handler: registerHandler,
  },
  [PACKET_TYPE.LOGIN_REQUEST]: {
    handler: loginHandler,
  },

  //방만들기 및 참여하기 나가기
  [PACKET_TYPE.CREATE_ROOM_REQUEST]: {
    handler: createRoomHandler,
  },
  [PACKET_TYPE.GET_ROOMLIST_REQUEST]: {
    handler: getRoomListHandler,
  },
  [PACKET_TYPE.JOIN_ROOM_REQUEST]: {
    handler: joinRoomHandler,
  },
  [PACKET_TYPE.JOIN_RANDOM_ROOM_REQUEST]: {
    handler: joinRandomRoomHandler,
  },
  [PACKET_TYPE.LEAVE_ROOM_REQUEST]: {
    handler: leaveRoomHandler,
  },

  //게임 준비 및 게임 시작
  [PACKET_TYPE.GAME_PREPARE_REQUEST]: {
    handler: gamePrepareHandler,
  },
  [PACKET_TYPE.GAME_START_REQUEST]: {
    handler: gameStartHandler,
  },

  //위치 동기화
  [PACKET_TYPE.POSITION_UPDATE_REQUEST]: {
    handler: positionUpdateHandler,
  },

  //카드 사용
  [PACKET_TYPE.USE_CARD_REQUEST]: {
    handler: useCardHandler,
  },
};

export const getProtoPacketType = (packetType) => {
  try {
    if (!handlers[packetType]) {
      console.error(`Handers Packet Type Error`, packetType);
    }
    return handlers[packetType].handler;
  } catch (err) {
    console.error(`프로토 패킷 타입 에러`, err);
  }
};
