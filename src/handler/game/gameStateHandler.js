import CharacterPosition from '../../classes/models/characterPosition.class.js';
import GameState from '../../classes/models/gameState.class.js';
import { RANDOM_POSITIONS } from '../../constants/characterPositions.js';
import { packetType } from '../../constants/header.js';
import { GlobalFailCode, PhaseType } from '../../init/loadProto.js';
import { redis } from '../../init/redis/redis.js';
import { getUserBySocket, modifyUserData } from '../../sessions/user.session.js';
import { sendNotificationToUsers } from '../../utils/notifications/notification.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { button } from './phaseUpdateHandler.js';

/**
 * @desc 게임준비
 * @author 한우종
 * @todo 게임시작 버튼 클릭시 state = 1 로 변경
 */
export const gamePrepareHandler = async (socket, payload) => {
  try {
    console.log(`게임준비!`);
    const failCode = GlobalFailCode.values;
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
    //       failCode: failCode.INVALID_ROOM_STATE,
    //     },
    //   };
    //   socket.write(createResponse(gamePreparePayload, packetType.GAME_PREPARE_RESPONSE, 0));
    //   return;
    // }

    // 요청한 유저가 owner인지 확인
    if (+currenRoomData.ownerId !== +user.id) {
      const gamePayload = { gamePrepareResponse: { success: false, failCode: failCode.NOT_ROOM_OWNER } };

      socket.write(createResponse(gamePayload, packetType.GAME_PREPARE_RESPONSE, 0));
      return;
    }

    // 캐릭터 클래스 생성 (캐릭터 종류, 역할, 체력, 무기, 상태, 장비, 디버프, handCards, 뱅카운터, handCardsCount)
    const handCards = [
      { type: 1, count: 1 },
      { type: 2, count: 1 },
      { type: 3, count: 1 },
      { type: 4, count: 1 },
      { type: 5, count: 1 },
    ];

    //방 상태 업데이트
    if (currenRoomData.state === '0') {
      await redis.updateUsersToRoom(currenUserRoomId, `state`, 1);
      const reCurrenRoomData = await redis.getAllFieldsFromHash(`room:${currenUserRoomId}`);

      const users = JSON.parse(reCurrenRoomData.users);
      for (const user of users) {
        user.character.characterType = 1;
        user.character.roleType = 1;
        user.character.handCards = handCards;
        user.character.handCardsCount = handCards.length;
        const userData = await redis.getAllFieldsFromHash(`user:${user.id}`);
        const userHandCards = JSON.stringify(handCards);
        const updatedUserData = {
          ...userData,
          characterType: 1,
          roleType: 1,
          handCards: userHandCards,
          handCardsCount: handCards.length,
        };
        await redis.addRedisToHash(`user:${user.id}`, updatedUserData);
      }

      await redis.addRedisToHash(`room:${reCurrenRoomData.id}`, { ...reCurrenRoomData, users: JSON.stringify(users) });

      const roomData = await redis.getAllFieldsFromHash(`room:${currenUserRoomId}`);
      //준비 notification 쏴주는부분
      roomData.users = JSON.parse(roomData.users);
      const notification = { gamePrepareNotification: { room: roomData } };

      sendNotificationToUsers(users, notification, packetType.GAME_PREPARE_NOTIFICATION, 0);

      //게임 준비 응답
      const gamePayload = { gamePrepareResponse: { success: true, failCode: failCode.NONE_FAILCODE } };
      socket.write(createResponse(gamePayload, packetType.GAME_PREPARE_RESPONSE, 0));
    }
  } catch (err) {
    console.error(`게임준비 에러`, err);
  }
};

/**
 * @desc 게임시작
 * @author 한우종
 * @todo 게임준비 상태시 잠시후 state = 2 로 변경
 */
export const gameStartHandler = async (socket, payload) => {
  try {
    console.log(`게임시작!`);
    const failCode = GlobalFailCode.values;
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

      // Session에 유저 위치정보 업데이트
      modifyUserData(user.id, { characterPosition: randomPosition });
      // 각 사용자 포지션을 넣어주는 부분
      positionData.push(characterPosition);
    }

    if (currenRoomData.state === '1') {
      await redis.updateUsersToRoom(currenUserRoomId, `state`, 2);
    }
    const currentPhase = PhaseType.values.DAY;
    const countTime = Date.now() + 5000;
    const newState = new GameState(currentPhase, countTime);
    //페이즈 업데이트 실행
    await button(socket);

    //게임 시작 notification
    const notification = { gameStartNotification: { gameState: newState, users: users, characterPositions: positionData } };
    sendNotificationToUsers(users, notification, packetType.GAME_START_NOTIFICATION, 0);

    const gamePayload = { gameStartResponse: { success: true, failCode: failCode.NONE_FAILCODE } };
    socket.write(createResponse(gamePayload, packetType.GAME_START_RESPONSE, 0));
  } catch (err) {
    console.error(`게임시작 에러`, err);
  }
};
