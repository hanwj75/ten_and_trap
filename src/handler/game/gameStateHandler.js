import CharacterPosition from '../../classes/models/characterPosition.class.js';
import { RANDOM_POSITIONS } from '../../constants/characterPositions.js';
import { packetType } from '../../constants/header.js';
import { GlobalFailCode } from '../../init/loadProto.js';
import { redis } from '../../init/redis/redis.js';
import { getUserBySocket } from '../../sessions/user.session.js';
import { sendNotificationToUsers } from '../../utils/notifications/notification.js';
import { createResponse } from '../../utils/response/createResponse.js';

/**
 * @desc 게임준비
 * @author 한우종
 * @todo 게임시작 버튼 클릭시 state = 1 로 변경
 * 
 * message S2CGamePrepareResponse {
    bool success = 1;
    GlobalFailCode failCode = 2;
} 

message S2CGamePrepareNotification {
    RoomData room = 1;
}
    1.게임시작시 최대인원이 아니면 예외처리 
 */
export const gamePrepareHandler = async (socket, payload) => {
  const user = await getUserBySocket(socket);

  //현재 유저가 있는 방ID
  const currenUserRoomId = await redis.getRoomByUserId(`user:${user.id}`, 'joinRoom');
  //현재 방에있는 유저 목록
  const getreadyUser = await redis.getRoomByUserId(`room:${currenUserRoomId}`, 'users');
  //방 상태 정보
  const currenRoomData = await redis.getAllFieldsFromHash(`room:${currenUserRoomId}`);
  //방에 있는 유저
  const users = await JSON.parse(getreadyUser);

  if (!user) {
    console.error(`존재하지 않는 유저입니다.`);
    return;
  }
  // //게임시작시 최대인원 아닐경우
  // if (users.length < currenRoomData.maxUserNum) {
  //   const gamePreparePayload = {
  //     gamePrepareResponse: {
  //       success: false,
  //       failCode: GlobalFailCode.values.INVALID_ROOM_STATE,
  //     },
  //   };
  //   socket.write(createResponse(gamePreparePayload, packetType.GAME_PREPARE_RESPONSE, 0));
  //   return;
  // }

  //방 상태 업데이트
  if (currenRoomData.state === '0') {
    await redis.updateUsersToRoom(currenUserRoomId, `state`, 1);
    //준비 notification 쏴주는부분
    const gamePrepareNotificationPayload = {
      gamePrepareNotification: {
        room: currenRoomData,
      },
    };

    sendNotificationToUsers(
      users,
      gamePrepareNotificationPayload,
      packetType.GAME_PREPARE_NOTIFICATION,
      0,
    );

    //게임 준비 응답
    const gamePreparePayload = {
      gamePrepareResponse: {
        success: true,
        failCode: GlobalFailCode.values.NONE_FAILCODE,
      },
    };
    socket.write(createResponse(gamePreparePayload, packetType.GAME_PREPARE_RESPONSE, 0));

    await gameStartHandler(socket, payload);
  }
};
/**
 * @desc 게임시작
 * @author 한우종
 * @todo 게임준비 상태시 잠시후 state = 2 로 변경
 * 1. gameStateData 추가해줘야함 =>gameState.class추가
 * 2. 캐릭터 데이터 넣어줘야함
 * 3. 시작하기전 예외처리 해줘야함
 * 4. 캐릭터 위치 랜덤하게 줘야함
 * 5. 중복위치 방지 해줘야함
 * 
 * message S2CGameStartResponse {
    bool success = 1;
    GlobalFailCode failCode = 2;
}

message S2CGameStartNotification {
    GameStateData gameState = 1;
    repeated UserData users = 2;
    repeated CharacterPositionData characterPositions = 3;
}
 */
export const gameStartHandler = async (socket, payload) => {
  const user = await getUserBySocket(socket);
  //현재 유저가 있는 방ID
  const currenUserRoomId = await redis.getRoomByUserId(`user:${user.id}`, 'joinRoom');
  //현재 방에있는 유저 목록
  const getreadyUser = await redis.getRoomByUserId(`room:${currenUserRoomId}`, 'users');
  //방 상태 정보
  const currenRoomData = await redis.getAllFieldsFromHash(`room:${currenUserRoomId}`);
  //방에 있는 유저
  const users = await JSON.parse(getreadyUser);
  //캐릭터 위치 정보 초기화
  const positionData = [];
  //캐릭터 랜덤 스폰 위치
  // 각 사용자에 대한 랜덤 위치 생성
  for (const user of users) {
    const randomKey = Math.floor(Math.random() * Object.keys(RANDOM_POSITIONS).length) + 1;
    const randomPosition = RANDOM_POSITIONS[randomKey];
    const characterPosition = new CharacterPosition(user.id, randomPosition);
    //각 사용자 포지션 넣어주는부분
    positionData.push(characterPosition);
  }

  if (currenRoomData.state === '1') {
    await redis.updateUsersToRoom(currenUserRoomId, `state`, 2);
  }

  console.log(`🤪 positionData:`, positionData);
  const gameStartNotificationPayload = {
    gameStartNotification: {
      gameState: currenRoomData,
      users: currenRoomData.users,
      characterPositions: positionData,
    },
  };

  sendNotificationToUsers(
    users,
    gameStartNotificationPayload,
    packetType.GAME_START_NOTIFICATION,
    0,
  );

  const gameStartPayload = {
    gameStartResponse: {
      success: true,
      failCode: GlobalFailCode.values.NONE_FAILCODE,
    },
  };

  socket.write(createResponse(gameStartPayload, packetType.GAME_START_RESPONSE, 0));
};
