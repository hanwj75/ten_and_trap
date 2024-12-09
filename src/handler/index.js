import { packetType } from '../constants/header.js';
import { loginHandler } from './user/loginHandler.js';
import { registerHandler } from './user/registerHandler.js';

import {
  createRoomHandler,
  getRoomListHandler,
  joinRandomRoomHandler,
  joinRoomHandler,
  leaveRoomHandler,
} from './room/roomHandler.js';
import { gamePrepareHandler, gameStartHandler } from './game/gameStateHandler.js';
import { positionUpdateHandler } from './game/positionUpdateHandler.js';

const testFunction = () => {
  console.log(`이거 지우고 넣으시면 됩니다.`);
};

const handlers = {
  // 회원가입 및 로그인
  [packetType.REGISTER_REQUEST]: {
    handler: registerHandler,
  },
  [packetType.LOGIN_REQUEST]: {
    handler: loginHandler,
  },

  //방만들기 및 참여하기 나가기
  [packetType.CREATE_ROOM_REQUEST]: {
    handler: createRoomHandler,
  },
  [packetType.GET_ROOMLIST_REQUEST]: {
    handler: getRoomListHandler,
  },
  [packetType.JOIN_ROOM_REQUEST]: {
    handler: joinRoomHandler,
  },
  [packetType.JOIN_RANDOM_ROOM_REQUEST]: {
    handler: joinRandomRoomHandler,
  },
  [packetType.LEAVE_ROOM_REQUEST]: {
    handler: leaveRoomHandler,
  },

  //게임 준비 및 게임 시작
  [packetType.GAME_PREPARE_REQUEST]: {
    handler: gamePrepareHandler,
  },
  [packetType.GAME_START_REQUEST]: {
    handler: gameStartHandler,
  },

  //위치 동기화
  [packetType.POSITION_UPDATE_REQUEST]: {
    handler: positionUpdateHandler,
  },

  //카드 사용
  [packetType.USE_CARD_REQUEST]: {
    handler: testFunction /*여기에 작성한 핸들러함수 넣어주시면 됩니다.*/,
  },
  [packetType.USE_CARD_NOTIFICATION]: {
    handler: testFunction /*여기에 작성한 핸들러함수 넣어주시면 됩니다.*/,
  },

  //유저 정보 업데이트
  [packetType.USER_UPDATE_NOTIFICATION]: {
    handler: testFunction /*여기에 작성한 핸들러함수 넣어주시면 됩니다.*/,
  },

  // 페이즈 업데이트
  [packetType.PHASE_UPDATE_NOTIFITION]: {
    handler: testFunction /*여기에 작성한 핸들러함수 넣어주시면 됩니다.*/,
  },

  // 게임 우승 알림
  [packetType.GAME_WIN_NOTIFICATION]: {
    handler: testFunction /*여기에 작성한 핸들러함수 넣어주시면 됩니다.*/,
  },

  // 게임 종료 알림
  [packetType.GAME_END_NOTIFICATION]: {
    handler: testFunction /*여기에 작성한 핸들러함수 넣어주시면 됩니다.*/,
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
