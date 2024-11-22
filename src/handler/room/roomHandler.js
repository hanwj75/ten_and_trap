import Room from '../../classes/models/room.class.js';
import { getUserBySocket, getUserById } from '../../sessions/user.session.js';
import { GlobalFailCode } from '../../init/loadProto.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { packetType } from '../../constants/header.js';
import { redis } from '../../init/redis/redis.js';

/**
 * @dest 방 만들기
 * @author 한우종
 * @todo 방 생성하기 요청 들어올시 방 생성해주기
 * !!!!!!!!!!!!!!
 * roomId 가변으로 바꿔줘야함
}
*/
let roomId = 1;

export const createRoomHandler = async (socket, payload) => {
  const { name, maxUserNum } = payload.createRoomRequest;

  const user = await getUserBySocket(socket);
  if (!user) {
    console.error(`존재하지 않는 유저입니다.`);
    return;
  }

  const userInfo = {
    id: user.id,
    nickname: user.nickName,
    character: user.character,
  };

  const roomByUserId = await redis.getRoomByUserId(`room:${user.id}`, `ownerId`);
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
  const newRoom = new Room(roomId, user.id, name, maxUserNum, 0, [userInfo]);
  roomId++;
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
  await redis.addRedisToHash(`room:${newRoom.ownerId}`, {
    id: newRoom.id,
    ownerId: newRoom.ownerId,
    name: newRoom.name,
    maxUserNum: newRoom.maxUserNum,
    state: newRoom.state,
    users: JSON.stringify(newRoom.users),
  });

  const userData = await redis.getAllFieldsFromHash(`user:${user.id}`);
  const updatedData = {
    ...userData,
    joinRoom: newRoom.id,
  };

  // redis에 유저 joinRoom정보 업데이트
  await redis.addRedisToHash(`user:${user.id}`, updatedData);

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
    const allRooms = [];
    if (roomKeys.length > 0) {
      for (const value of roomKeys) {
        const roomData = await redis.getAllFieldsFromHash(value);
        roomData.users = JSON.parse(roomData.users);
        allRooms.push(roomData);
      }
    }
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
 * @author 박건순
 * @todo 방 리스트에 있는 방 선택해서 들어가기
 * message S2CJoinRoomResponse {
    bool success = 1;
    RoomData room = 2;
    GlobalFailCode failCode = 3;
}
 */
export const joinRoomHandler = async (socket, payload) => {
  const { roomId } = payload.joinRoomRequest;
  const roomKeys = await redis.getRoomKeys('room:*');
  const roomKey = await redis.findRoomKeyToField(roomKeys, 'id', roomId);
  const roomData = await redis.getAllFieldsFromHash(roomKey);
  const user = await getUserBySocket(socket);

  //게임이 시작했거나 방 인원이 최대인 경우
  if (roomData.state != 0) {
    console.error('게임이 시작한 방입니다.');
    const joinRoomPayload = {
      joinRoomResponse: {
        success: false,
        room: null,
        failCode: GlobalFailCode.values.JOIN_ROOM_FAILED,
      },
    };
    socket.write(createResponse(joinRoomPayload, packetType.JOIN_ROOM_RESPONSE, 0));
  }

  const newUserInfo = {
    id: user.id,
    nickname: user.nickName,
    character: user.character,
  };

  const joinRoomNotificationPayload = {
    joinRoomNotification: {
      joinUser: newUserInfo,
    },
  };

  roomData.users = await JSON.parse(roomData.users); // 기존 유저 목록 가져오기
  roomData.users.forEach((element) => {
    const user = getUserById(Number(element.id));
    user.socket.write(
      createResponse(joinRoomNotificationPayload, packetType.JOIN_ROOM_NOTIFICATION, 0),
    );
  });
  // 유저를 방의 유저 목록에 추가
  roomData.users.push(newUserInfo);
  console.log('userId:' + JSON.stringify(newUserInfo.id));
  console.log('roomData:' + JSON.stringify(roomData.users));
  // 방 정보 업데이트
  await redis.addRedisToHash(roomKey, {
    ...roomData,
    users: JSON.stringify(roomData.users), // 유저 정보를 JSON 문자열로 변환하여 저장
  });

  // 유저 정보 업데이트
  const userData = await redis.getAllFieldsFromHash(`user:${user.id}`);
  const updatedData = {
    ...userData,
    joinRoom: roomData.id,
  };
  await redis.addRedisToHash(`user:${user.id}`, updatedData);

  const joinRoomPayload = {
    joinRoomResponse: {
      success: true,
      room: roomData,
      failCode: GlobalFailCode.values.NONE_FAILCODE,
    },
  };
  socket.write(createResponse(joinRoomPayload, packetType.JOIN_ROOM_RESPONSE, 0));
};

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
    const joinRandomRoomPayload = {
      joinRandomRoomResponse: {
        success: false,
        room: null,
        failCode: GlobalFailCode.values.ROOM_NOT_FOUND,
      },
    };
    socket.write(createResponse(joinRandomRoomPayload, packetType.JOIN_RANDOM_ROOM_RESPONSE, 0));
    return;
  }
  const randomIndex = Math.floor(Math.random() * roomKeys.length);
  const randomRoomKey = roomKeys[randomIndex];

  const roomData = await redis.getAllFieldsFromHash(randomRoomKey);

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
    return;
  }
  roomData.users = await JSON.parse(roomData.users); // 기존 유저 목록 가져오기
  const newUserInfo = {
    id: user.id,
    nickname: user.nickName,
    character: user.character,
  };

  //방 인원이 최대인 경우
  if (roomData.state === 1 && roomData.users.length >= roomData.maxUserNum) {
    console.error('최대 인원입니다.');
    const joinRandomRoomPayload = {
      joinRandomRoomResponse: {
        success: false,
        room: null,
        failCode: GlobalFailCode.values.JOIN_ROOM_FAILED,
      },
    };
    socket.write(createResponse(joinRandomRoomPayload, packetType.JOIN_RANDOM_ROOM_RESPONSE, 0));
    return;
  }
  //방 상태 변경 알림
  const joinRoomNotificationPayload = {
    joinRoomNotification: {
      joinUser: newUserInfo,
    },
  };

  roomData.users.forEach((element) => {
    const user = getUserById(Number(element.id));
    user.socket.write(
      createResponse(joinRoomNotificationPayload, packetType.JOIN_ROOM_NOTIFICATION, 0),
    );
  });

  // 유저를 방의 유저 목록에 추가
  roomData.users.push(newUserInfo);

  // 방 정보 업데이트
  await redis.addRedisToHash(randomRoomKey, {
    ...roomData,
    users: JSON.stringify(roomData.users), // 유저 정보를 JSON 문자열로 변환하여 저장
  });

  // 유저 정보 업데이트
  const userData = await redis.getAllFieldsFromHash(`user:${user.id}`);
  const updatedData = {
    ...userData,
    joinRoom: roomData.id,
  };
  await redis.addRedisToHash(`user:${user.id}`, updatedData);

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
