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

  const roomByUserId = await redis.getRoomByUserId(`room:${roomId}`, `ownerId`);
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
  await redis.addRedisToHash(`room:${newRoom.id}`, {
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

  if (roomData.users.length >= roomData.maxUserNum) {
    console.error('최대 인원입니다.');
    const joinRoomPayload = {
      joinRoomResponse: {
        success: false,
        room: null,
        failCode: GlobalFailCode.values.JOIN_ROOM_FAILED,
      },
    };
    socket.write(createResponse(joinRoomPayload, packetType.JOIN_ROOM_RESPONSE, 0));
    return;
  }
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
  if (roomData.state != 0) {
    console.error('게임이 시작한 방입니다.');
    const joinRoomPayload = {
      joinRoomResponse: {
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
  if (roomData.users.length >= roomData.maxUserNum) {
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
    message S2CLeaveRoomNotification {
    int64 userId = 1;
}

leaveRoomResponse

leaveRoomNotification

1.유저의 방 나가기 요청이들어옴 11
2.요청을 한 유저의 id를 확인하고 roomData에서 해당유저 삭제후 true 11 
3.나머지 유저에게 notification 보내주기 11
4.마지막 유저가 나갈시 방삭제 xx =>방장이 나가면 어차피 터짐 필요없음
5.방이 존재하지 않을시 에러처리 11
6.해당 방에 유저가 없을시 에러처리 11
7.방장이 나가면 방이터짐

 */

export const leaveRoomHandler = async (socket, payload) => {
  const user = await getUserBySocket(socket);
  if (!user) {
    console.error(`존재하지 않는 유저입니다.`);
    return;
  }
  const currentUserId = user.id;
  //현재 나가려하는 방의 키값
  const leaveRequestRoomId = await redis.getRoomByUserId(`user:${currentUserId}`, `joinRoom`);

  if (!leaveRequestRoomId) {
    console.error(`사용자가 참여하고 있는 방이 없습니다: user:${user.id}`);
    const leaveRoomPayload = {
      leaveRoomResponse: {
        success: false,
        failCode: GlobalFailCode.values.LEAVE_ROOM_FAILED,
      },
    };
    socket.write(createResponse(leaveRoomPayload, packetType.LEAVE_ROOM_RESPONSE, 0));
    return;
  }

  //나가는 유저의 정보
  const getLeaveUserId = await redis.getRoomByUserId(`room:${leaveRequestRoomId}`, `users`);

  if (!getLeaveUserId) {
    console.error(`사용자가 참여하고 있는 방이 없습니다: user:${user.id}`);
    const leaveRoomPayload = {
      leaveRoomResponse: {
        success: false,
        failCode: GlobalFailCode.values.LEAVE_ROOM_FAILED,
      },
    };
    socket.write(createResponse(leaveRoomPayload, packetType.LEAVE_ROOM_RESPONSE, 0));
    return;
  }
  //users 필드값
  const users = JSON.parse(getLeaveUserId);

  // 현재 유저의 socket.id에 해당하는 객체의 인덱스를 찾음
  const userIndex = users.findIndex((user) => user.id === currentUserId);

  if (userIndex !== -1) {
    // 해당 인덱스의 객체를 배열에서 제거
    const removedUser = users.splice(userIndex, 1)[0]; // 제거된 유저 객체를 가져옴

    const leaveRoomNotificationPayload = {
      leaveRoomNotification: {
        userId: removedUser.id, // 나가는 유저 정보
      },
    };
    // 방의 다른 사용자들에게 알림 전송
    users.forEach((element) => {
      const otherUser = getUserById(Number(element.id));
      if (otherUser) {
        otherUser.socket.write(
          createResponse(leaveRoomNotificationPayload, packetType.LEAVE_ROOM_NOTIFICATION, 0),
        );
      }
    });
  }

  //redis에 업데이트
  await redis.updateUsersToRoom(leaveRequestRoomId, 'users', users);

  //현재 유저의 id를 필터링 하고 그값을 제외한 배열 생성

  const leaveRoomPayload = {
    leaveRoomResponse: {
      success: true,
      failCode: GlobalFailCode.values.NONE_FAILCODE,
    },
  };
  socket.write(createResponse(leaveRoomPayload, packetType.LEAVE_ROOM_RESPONSE, 0));
};
