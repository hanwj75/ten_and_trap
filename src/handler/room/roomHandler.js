// NONE_FAILCODE = 0;
// UNKNOWN_ERROR = 1;
// INVALID_REQUEST = 2;
// AUTHENTICATION_FAILED = 3;
// CREATE_ROOM_FAILED = 4;
// JOIN_ROOM_FAILED = 5;
// LEAVE_ROOM_FAILED = 6;
// REGISTER_FAILED = 7;
// ROOM_NOT_FOUND = 8;
// CHARACTER_NOT_FOUND = 9;
// CHARACTER_STATE_ERROR = 10;
// CHARACTER_NO_CARD = 11;
// INVALID_ROOM_STATE = 12;
// NOT_ROOM_OWNER = 13;
// ALREADY_USED_BBANG = 14;
// INVALID_PHASE = 15;
// CHARACTER_CONTAINED = 16;

import Room from '../../classes/models/room.class.js';
import { v4 as uuidv4 } from 'uuid';
import { getUserBySocket } from '../../sessions/user.session.js';
import { GlobalFailCode } from '../../init/loadProto.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { packetType } from '../../constants/header.js';
import { redis } from '../../init/redis/redis.js';
import { addRoom, getAllRoom } from '../../sessions/room.session.js';

/**
 * @dest 방 만들기
 * @author 한우종
 * @todo 방 생성하기 요청 들어올시 방 생성해주기
 * 
}
*/

export const createRoomHandler = async (socket, payload) => {
  const { name, maxUserNum } = payload.createRoomRequest;
  const roomId = 1;

  const users = await getUserBySocket(socket);

  if (!users) {
    console.error(`존재하지 않는 유저입니다.`);
    return;
  }

  const userInfo = {
    id: users.userId,
    nickname: users.nickName,
    character: users.character,
  };

  const roomByUserId = await redis.getRoomByUserId(`room:${userInfo.id}`, `ownerId`);
  if (roomByUserId) {
    console.error(`이미 방을 소유하고있음`);
    const createRoomPayload = {
      createRoomResponse: {
        success: false,
        room: null,
        failCode: GlobalFailCode.values.CREATE_ROOM_FAILED,
      },
    };
    socket.write(createResponse(createRoomPayload, packetType.CREATE_ROOM_RESPONSE, 0));
    return;
  }

  //방 이름과 최대인원수를 담아 요청이오면 나는 success:true , roomData:id, ownerId, name, maxUserNum, state, users , failCode만 보내주면 방은 생길듯
  const newRoom = new Room(roomId, userInfo.id, name, maxUserNum, 0, [userInfo]);
  /**
   * newRoom에서 저장해야할 값
   * 
room:id: 방 ID
room:ownerId: 방 소유자 ID
room:name: 방 이름
room:maxUserNum: 최대 유저 수
room:state: 방 상태 (0, 1, 2)
room:users: JSON 문자열로 변환한 유저 정보 배열
   */

  //redis에 방 정보 저장
  await redis.addRoomRedis(`room:${newRoom.ownerId}`, {
    id: newRoom.id,
    ownerId: newRoom.ownerId,
    name: newRoom.name,
    maxUserNum: newRoom.maxUserNum,
    state: newRoom.state,
    users: JSON.stringify(newRoom.users),
  });

  const createRoomPayload = {
    createRoomResponse: {
      success: true,
      room: newRoom,
      failCode: GlobalFailCode.values.NONE_FAILCODE,
    },
  };
  socket.write(createResponse(createRoomPayload, packetType.CREATE_ROOM_RESPONSE, 0));
};

/**
 * @dest 방 리스트 조회
 * @author 박건순
 * @todo 현재 존재하는 방 목록 보여주기
 * message S2CGetRoomListResponse{
    repeated RoomData rooms = 1;
}

 */
export const getRoomListHandler = async (socket) => {
  try {
    const roomKeys = await redis.getRoomKeys('room:*'); // 모든 방 키를 가져옴
    console.log(roomKeys);
    const allRooms = [];
    for (const value of roomKeys) {
      const roomData = await redis.getAllFieldsFromHash(value);
      roomData.users = JSON.parse(roomData.users);
      allRooms.push(roomData);
    }
    console.log('testhash:' + allRooms);
    const getRoomListPayload = {
      getRoomListResponse: {
        rooms: allRooms,
      },
    };
    socket.write(createResponse(getRoomListPayload, packetType.GET_ROOMLIST_RESPONSE, 0));
  } catch (err) {
    console.error(err);
  }
};

/**
 * @dest 방 들어가기
 * @author 한우종
 * @todo 방 리스트에 있는 방 선택해서 들어가기
 * message S2CJoinRoomResponse {
    bool success = 1;
    RoomData room = 2;
    GlobalFailCode failCode = 3;
}
 */
export const joinRoomHandler = (socket, payload) => {};

/**
 * @dest 랜덤매칭
 * @author 한우종
 * @todo 존재하는 방 중에서 랜덤하게 들어가기
 *
 * 1. roomList가져오기 ㅇ
 * 2. roomList에서 랜덤한 값에 따라 해당 방에 참여 ㅇ
 * 3. 게임이 시작한 경우 에러처리
 * 4. 방이 가득찬 경우 === state = 1인 경우
 */

export const joinRandomRoomHandler = async (socket, payload) => {
  //방이 너무 많을경우 그걸 다 불러올수없음
  //유효한 사용자가 아닌경우 ,게임이 시작한 경우 제외 , 가득찬 경우 제외 ,

  //1.유효한 사용자가 아닌경우
  const user = await getUserBySocket(socket);
  if (!user) {
    console.error(`유효하지 않은 사용자`);
    return;
  }

  //현재 방 목록 가져오기
  const roomKeys = await redis.getRoomKeys('room:*'); // 모든 방 키를 가져옴

  //방 목록이 없을경우
  if (roomKeys.length > 0) {
    console.log('방 키들:', roomKeys);
  } else {
    console.log('해당 방이 존재하지 않습니다.');
  }
  const randomIndex = Math.floor(Math.random() * roomKeys.length);
  const randomRoomKey = roomKeys[randomIndex];

  const roomData = await redis.getAllFieldsFromHash(randomRoomKey);
  console.log(`🤪 ~ file: roomHandler.js:178 ~ joinRandomRoomHandler ~ roomData:`, roomData);

  //게임이 시작한 경우

  if (roomData.state === 2) {
    console.error('게임이 시작한 방입니다.');
    const joinRandomRoomPayload = {
      joinRandomRoomResponse: {
        success: false,
        room: null,
        failCode: GlobalFailCode.values.JOIN_ROOM_FAILED,
      },
    };
    socket.write(createResponse(joinRandomRoomPayload, packetType.JOIN_RANDOM_ROOM_RESPONSE, 0));
  }
  roomData.users = await JSON.parse(roomData.users); // 기존 유저 목록 가져오기
  const newUserInfo = {
    id: user.userId,
    nickname: user.nickName,
    character: user.character,
  };

  // 유저를 방의 유저 목록에 추가
  roomData.users.push(newUserInfo);

  // 방 정보 업데이트
  await redis.addRoomRedis(randomRoomKey, {
    ...roomData,
    users: JSON.stringify(roomData.users), // 유저 정보를 JSON 문자열로 변환하여 저장
  });

  //방 인원이 최대인 경우
  if (roomData.state === 1) {
    console.error('최대 인원입니다.');
    const joinRandomRoomPayload = {
      joinRandomRoomResponse: {
        success: false,
        room: null,
        failCode: GlobalFailCode.values.JOIN_ROOM_FAILED,
      },
    };
    socket.write(createResponse(joinRandomRoomPayload, packetType.JOIN_RANDOM_ROOM_RESPONSE, 0));
  }
  //랜덤매칭에 성공한 경우
  const joinRandomRoomPayload = {
    joinRandomRoomResponse: {
      success: true,
      room: roomData,
      failCode: GlobalFailCode.values.NONE_FAILCODE,
    },
  };
  socket.write(createResponse(joinRandomRoomPayload, packetType.JOIN_RANDOM_ROOM_RESPONSE, 0));
};

/**
 * @dest 방 나가기
 * @author 한우종
 * @todo 참여한 방에서 나가기
 * message S2CLeaveRoomResponse {
    bool success = 1;
    GlobalFailCode failCode = 2;
}
 */
export const leaveRoomHandler = (socket, payload) => {};
