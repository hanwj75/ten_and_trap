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

/**
 * @dest 방 만들기
 * @author 한우종
 * @todo 방 생성하기 요청 들어올시 방 생성해주기
 * 1.방을 만들때 rooms가없다면 rooms만든다.
 * 2. rooms가 있다면 랜덤인덱스에 해당하는 방에 유저를 푸시한다
 * 
 * .room을 만든다. room에는 방장이있다. 이값을 rooms에저장한다.
 * 1. rooms를 조회한다. 
 * 2. rooms에 room이없다면 room을 만든다.
 * 
}

*/

export const createRoomHandler = async (socket, payload) => {
  const { name, maxUserNum } = payload;
  const users = await getUserBySocket(socket);
  const roomId = uuidv4();
  let rooms = null;
  const userInfo = {
    id: users.userId,
    nickname: users.nickName,
    character: users.character,
  };
  if (rooms) {
    await redis.addRoomToUser('rooms', roomId);
    await redis.addRoomsToRoom(roomId, users.nickName);
  } else {
    await redis.saddRedis('rooms', roomId);
    await redis.saddRedis(roomId, users.nickName);
  }
  //방 이름과 최대인원수를 담아 요청이오면 나는 success:true , roomData:id, ownerId, name, maxUserNum, state, users , failCode만 보내주면 방은 생길듯
  const newRoom = new Room(roomId, users.userId, name, maxUserNum, 0, userInfo);
  const createRoomPayload = {
    createRoomResponse: {
      success: true,
      message: `방 생성 성공_${roomId}`,
      room: newRoom,
      failCode: GlobalFailCode.values.NONE_FAILCODE,
    },
  };
  socket.write(createResponse(createRoomPayload, packetType.CREATE_ROOM_RESPONSE, 0));
};

/**
 * @dest 방 리스트 조회
 * @author 한우종
 * @todo 현재 존재하는 방 목록 보여주기
 * message S2CGetRoomListResponse{
    repeated RoomData rooms = 1;
}

 */
export const getRoomListHandler = (socket, payload) => {};

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
 * message S2CJoinRandomRoomResponse {
    bool success = 1;
    RoomData room = 2;
    GlobalFailCode failCode = 3;
  3. rooms가 있다면 그 인덱스값을 랜덤값으로 응답한다.
 * 4. 인원수 체크는 state값이 0인지1인지로 판단
 * 5. rooms 조회 , roomId 조회 , Math.floor(Math.random(0)*rooms.length)
} 
 */

export const joinRandomRoomHandler = async (socket, payload) => {
  const roomsArray = await redis.getRedisSadd('rooms');
  const roomId = await redis.getRedisSadd(roomsArray[0]);
  if (roomId) {
  }
  const joinRandomRoomPayload = {
    joinRandomRoomResponse: {
      success: true,
      message: `랜덤 매칭 성공!${roomId}`,
      room: roomId,
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
