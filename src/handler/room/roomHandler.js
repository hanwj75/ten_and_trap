import Room from '../../classes/models/room.class.js';
import { getUserBySocket, modifyUserData } from '../../sessions/user.session.js';
import { GlobalFailCode } from '../../init/loadProto.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { packetType } from '../../constants/header.js';
import { redis } from '../../init/redis/redis.js';
import { sendNotificationToUsers } from '../../utils/notifications/notification.js';

/**
 * @desc 방 만들기
 * @author 한우종
 * @todo 방 생성하기 요청 들어올시 방 생성해주기
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

  // Session에 유저 joinRoom정보 업데이트
  modifyUserData(user.id, { joinRoom: newRoom.id });

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
 * @desc 방 리스트 조회
 * @author 박건순
 * @todo 현재 존재하는 방 목록 보여주기
 */
export const getRoomListHandler = async (socket, payload) => {
  try {
    const roomKeys = await redis.getRoomKeys('room:*'); // 모든 방 키를 가져옴
    let allRooms = [];
    if (roomKeys.length > 0) {
      allRooms = await redis.getAllFieldsByValue(roomKeys, 'state', '0');
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
 * @desc 방 들어가기
 * @author 박건순
 * @todo 방 리스트에 있는 방 선택해서 들어가기
 */
export const joinRoomHandler = async (socket, payload) => {
  const { roomId } = payload.joinRoomRequest;
  const roomKeys = await redis.getRoomKeys('room:*');
  const roomKey = await redis.findRoomKeyToField(roomKeys, 'id', roomId);
  const roomData = await redis.getAllFieldsFromHash(roomKey);
  const user = await getUserBySocket(socket);

  //게임이 시작했거나 방 인원이 최대인 경우
  if (roomData.state !== '0') {
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

  sendNotificationToUsers(
    roomData.users,
    joinRoomNotificationPayload,
    packetType.JOIN_ROOM_NOTIFICATION,
    0,
  );
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

  // Session에 유저 joinRoom정보 업데이트
  modifyUserData(user.id, { joinRoom: roomData.id });

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
 * @desc 랜덤매칭
 * @author 한우종
 * @todo 존재하는 방 중에서 랜덤하게 들어가기
 */
export const joinRandomRoomHandler = async (socket, payload) => {
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

  let allRooms = await redis.getAllFieldsByValue(roomKeys, 'state', '0');

  let roomData;
  if (allRooms != null) {
    const randomIndex = Math.floor(Math.random() * allRooms.length);
    const randomRoomKey = allRooms[randomIndex];
    roomData = await redis.getAllFieldsFromHash(`room:${randomRoomKey.id}`);
  } else {
    console.log('해당되는 방이 존재하지 않습니다.');
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

  sendNotificationToUsers(
    roomData.users,
    joinRoomNotificationPayload,
    packetType.JOIN_ROOM_NOTIFICATION,
    0,
  );
  // 유저를 방의 유저 목록에 추가
  roomData.users.push(newUserInfo);

  // 방 정보 업데이트
  await redis.addRedisToHash(`room:${roomData.id}`, {
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

  // Session에 유저 joinRoom정보 업데이트
  modifyUserData(user.id, { joinRoom: roomData.id });

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
 * @desc 방 나가기
 * @author 한우종
 * @todo 참여한 방에서 나가기
 */
export const leaveRoomHandler = async (socket, payload) => {
  const user = await getUserBySocket(socket);
  const currentUserId = user.id;
  //현재 나가려하는 방의 키값
  const leaveRequestRoomId = await redis.getRoomByUserId(`user:${currentUserId}`, `joinRoom`);
  //나가는 유저의 정보
  const getLeaveUserId = await redis.getRoomByUserId(`room:${leaveRequestRoomId}`, `users`);
  //해당 방의 방장
  const getOwnerId = await redis.getRoomByUserId(`room:${leaveRequestRoomId}`, `ownerId`);

  if (!user) {
    console.error(`존재하지 않는 유저입니다.`);
    return;
  }

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
    const removeUser = users.splice(userIndex, 1)[0];
    const leaveRoomNotificationPayload = {
      leaveRoomNotification: {
        userId: removeUser.id,
      },
    };
    sendNotificationToUsers(
      users,
      leaveRoomNotificationPayload,
      packetType.LEAVE_ROOM_NOTIFICATION,
      0,
    );

    const roomOwnerId = removeUser.id === Number(getOwnerId);

    await redis.updateUsersToRoom(leaveRequestRoomId, 'users', users);

    // Session에 유저 joinRoom정보 업데이트
    modifyUserData(user.id, { joinRoom: null });

    if (roomOwnerId || users.length === 0) {
      // 방 삭제 알림
      const leaveRoomPayload = {
        leaveRoomResponse: {
          success: true,
          failCode: GlobalFailCode.values.NONE_FAILCODE,
        },
      };
      sendNotificationToUsers(users, leaveRoomPayload, packetType.LEAVE_ROOM_RESPONSE, 0);

      // 모든 사용자 상태 업데이트
      users.forEach(async (user) => {
        await redis.setRoomByUserId(`user:${user.id}`, `joinRoom`, null);
      });

      // Redis에서 방 데이터 삭제
      await redis.delRedisByKey(`room:${leaveRequestRoomId}`);
    }
  }
  const leaveRoomPayload = {
    leaveRoomResponse: {
      success: true,
      failCode: GlobalFailCode.values.NONE_FAILCODE,
    },
  };
  socket.write(createResponse(leaveRoomPayload, packetType.LEAVE_ROOM_RESPONSE, 0));
};
