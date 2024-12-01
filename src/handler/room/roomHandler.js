import Room from '../../classes/models/room.class.js';
import { getUserBySocket, modifyUserData } from '../../sessions/user.session.js';
import { GlobalFailCode } from '../../init/loadProto.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { packetType } from '../../constants/header.js';
import { redis } from '../../init/redis/redis.js';
import { sendNotificationToUsers } from '../../utils/notifications/notification.js';
import { characterInitData } from '../../init/initData.js';
import { handleError } from '../../utils/error/errorHandler.js';
import { ErrorCodes } from '../../utils/error/errorCodes.js';
import CustomError from '../../utils/error/customError.js';

/**
 * @desc 방 만들기
 * @author 한우종
 * @todo 방 생성하기 요청 들어올시 방 생성해주기
 */
let roomId = 1;
export const createRoomHandler = async (socket, payload) => {
  const failCode = GlobalFailCode.values;
  try {
    const { name, maxUserNum } = payload.createRoomRequest;

    const user = await getUserBySocket(socket);

    if (!user) {
      console.error(`존재하지 않는 유저입니다.`);
      throw new CustomError(ErrorCodes.UNKNOWN_ERROR, `존재하지 않는 유저입니다.`);
    }

    const userInfo = { id: user.id, nickname: user.nickName, character: characterInitData };

    // 모든 방의 키를 가져옴
    const roomKeys = await redis.getRedisToKeys(`room:*`);
    const ownerId = await redis.getRedisToHash(`user:${user.id}`, `id`);

    // 현재 사용자가 이미 방을 소유하고 있는지 확인
    for (const roomKey of roomKeys) {
      const roomOwnerId = await redis.getRedisToHash(roomKey, `ownerId`);

      if (roomOwnerId === ownerId) {
        const roomPayload = { createRoomResponse: { success: false, room: null, failCode: failCode.CREATE_ROOM_FAILED } };
        socket.write(createResponse(roomPayload, packetType.CREATE_ROOM_RESPONSE, 0));

        throw new CustomError(ErrorCodes.CREATE_ROOM_FAILED, `이미 방을 소유하고 있습니다.`);
      }
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
      isPushed: newRoom.isPushed,
      phase: newRoom.phase,
    });

    const userData = await redis.getAllFieldsFromHash(`user:${user.id}`);
    const updatedData = { ...userData, joinRoom: newRoom.id };

    // redis에 유저 joinRoom정보 업데이트
    await redis.addRedisToHash(`user:${user.id}`, updatedData);

    // Session에 유저 joinRoom정보 업데이트
    modifyUserData(user.id, { joinRoom: newRoom.id });

    const roomPayload = { createRoomResponse: { success: true, room: newRoom, failCode: failCode.NONE_FAILCODE } };
    socket.write(createResponse(roomPayload, packetType.CREATE_ROOM_RESPONSE, 0));
  } catch (err) {
    handleError(socket, err);
  }
};

/**
 * @desc 방 리스트 조회
 * @author 박건순
 * @todo 현재 존재하는 방 목록 보여주기
 */
export const getRoomListHandler = async (socket, payload) => {
  try {
    const failCode = GlobalFailCode.values;
    const roomKeys = await redis.getRedisToKeys('room:*'); // 모든 방 키를 가져옴

    let allRooms = [];
    if (roomKeys.length > 0) {
      allRooms = await redis.getAllFieldsByValue(roomKeys, 'state', '0');
    }
    const roomPayload = { getRoomListResponse: { rooms: allRooms } };
    socket.write(createResponse(roomPayload, packetType.GET_ROOMLIST_RESPONSE, 0));
  } catch (err) {
    handleError(socket, err);
  }
};

/**
 * @desc 방 들어가기
 * @author 박건순
 * @todo 방 리스트에 있는 방 선택해서 들어가기
 */
export const joinRoomHandler = async (socket, payload) => {
  try {
    const failCode = GlobalFailCode.values;
    const { roomId } = payload.joinRoomRequest;

    const roomKeys = await redis.getRedisToKeys('room:*');
    const roomKey = await redis.findRedisKeyToField(roomKeys, 'id', roomId);
    const roomData = await redis.getAllFieldsFromHash(roomKey);
    const user = await getUserBySocket(socket);

    //방이 존재하지 않을경우
    if (!roomKeys) {
      console.error(`존재하지 않는 방입니다.`);
      const roomPayload = { joinRoomResponse: { success: false, room: null, failCode: failCode.JOIN_ROOM_FAILED } };
      socket.write(createResponse(roomPayload, packetType.JOIN_ROOM_RESPONSE, 0));

      throw new CustomError(ErrorCodes.JOIN_ROOM_FAILED, `존재하지 않는 방입니다.`);
    }

    //게임이 시작한 경우
    if (roomData.state !== '0') {
      console.error('게임이 시작한 방입니다.');
      const roomPayload = { joinRoomResponse: { success: false, room: null, failCode: failCode.JOIN_ROOM_FAILED } };
      socket.write(createResponse(roomPayload, packetType.JOIN_ROOM_RESPONSE, 0));

      throw new CustomError(ErrorCodes.LEAVE_ROOM_FAILED, `게임이 시작한 방입니다.`);
    }

    roomData.users = await JSON.parse(roomData.users); // 기존 유저 목록 가져오기

    //이미 방에 존재하는 경우
    const userExists = roomData.users.some((existingUser) => existingUser.id === user.id);
    if (userExists) {
      console.error('이미 방에 참여한 유저입니다.');
      const roomPayload = { joinRoomResponse: { success: false, room: null, failCode: failCode.JOIN_ROOM_FAILED } };
      socket.write(createResponse(roomPayload, packetType.JOIN_ROOM_RESPONSE, 0));

      throw new CustomError(ErrorCodes.JOIN_ROOM_FAILED, `이미 방에 참여한 유저입니다.`);
    }
    const newUserInfo = { id: user.id, nickname: user.nickName, character: characterInitData };
    const notification = { joinRoomNotification: { joinUser: newUserInfo } };

    sendNotificationToUsers(roomData.users, notification, packetType.JOIN_ROOM_NOTIFICATION, 0);

    if (roomData.users.length >= roomData.maxUserNum) {
      console.error('최대 인원입니다.');
      const roomPayload = { joinRoomResponse: { success: false, room: null, failCode: failCode.JOIN_ROOM_FAILED } };
      socket.write(createResponse(roomPayload, packetType.JOIN_ROOM_RESPONSE, 0));

      throw new CustomError(ErrorCodes.LEAVE_ROOM_FAILED, `최대 인원입니다.`);
    }
    // 유저를 방의 유저 목록에 추가
    roomData.users.push(newUserInfo);

    // 방 정보 업데이트
    await redis.addRedisToHash(roomKey, { ...roomData, users: JSON.stringify(roomData.users) });

    // 유저 정보 업데이트
    const userData = await redis.getAllFieldsFromHash(`user:${user.id}`);
    const updatedData = { ...userData, joinRoom: roomData.id };
    await redis.addRedisToHash(`user:${user.id}`, updatedData);

    // Session에 유저 joinRoom정보 업데이트
    modifyUserData(user.id, { joinRoom: roomData.id });

    const roomPayload = {
      joinRoomResponse: { success: true, room: roomData, failCode: failCode.NONE_FAILCODE },
    };
    socket.write(createResponse(roomPayload, packetType.JOIN_ROOM_RESPONSE, 0));
  } catch (err) {
    handleError(socket, err);
  }
};

/**
 * @desc 랜덤매칭
 * @author 한우종
 * @todo 존재하는 방 중에서 랜덤하게 들어가기
 */
export const joinRandomRoomHandler = async (socket, payload) => {
  try {
    const failCode = GlobalFailCode.values;
    //1.유효한 사용자가 아닌경우
    const user = await getUserBySocket(socket);
    if (!user) {
      throw new CustomError(ErrorCodes.UNKNOWN_ERROR, `유효하지 않은 사용자`);
    }

    //현재 방 목록 가져오기
    const roomKeys = await redis.getRedisToKeys('room:*'); // 모든 방 키를 가져옴

    //방 목록이 없을경우
    if (roomKeys.length > 0) {
    } else {
      const roomPayload = { joinRandomRoomResponse: { success: false, room: null, failCode: failCode.ROOM_NOT_FOUND } };
      socket.write(createResponse(roomPayload, packetType.JOIN_RANDOM_ROOM_RESPONSE, 0));

      throw new CustomError(ErrorCodes.ROOM_NOT_FOUND, `해당 방이 존재하지 않습니다.`);
    }

    let allRooms = await redis.getAllFieldsByValue(roomKeys, 'state', '0');

    let roomData;
    if (allRooms != null) {
      const randomIndex = Math.floor(Math.random() * allRooms.length);
      const randomRoomKey = allRooms[randomIndex];
      roomData = await redis.getAllFieldsFromHash(`room:${randomRoomKey.id}`);
    } else {
      const roomPayload = { joinRandomRoomResponse: { success: false, room: null, failCode: failCode.ROOM_NOT_FOUND } };
      socket.write(createResponse(roomPayload, packetType.JOIN_RANDOM_ROOM_RESPONSE, 0));

      throw new CustomError(ErrorCodes.ROOM_NOT_FOUND, `해당되는 방이 존재하지 않습니다.`);
    }

    roomData.users = await JSON.parse(roomData.users); // 기존 유저 목록 가져오기
    const newUserInfo = { id: user.id, nickname: user.nickName, character: characterInitData };

    //방 인원이 최대인 경우
    if (roomData.users.length >= roomData.maxUserNum) {
      const roomPayload = { joinRandomRoomResponse: { success: false, room: null, failCode: failCode.JOIN_ROOM_FAILED } };
      socket.write(createResponse(roomPayload, packetType.JOIN_RANDOM_ROOM_RESPONSE, 0));

      throw new CustomError(ErrorCodes.JOIN_ROOM_FAILED, `최대 인원입니다.`);
    }
    //방 상태 변경 알림
    const notification = { joinRoomNotification: { joinUser: newUserInfo } };

    sendNotificationToUsers(roomData.users, notification, packetType.JOIN_ROOM_NOTIFICATION, 0);
    // 유저를 방의 유저 목록에 추가
    roomData.users.push(newUserInfo);

    // 방 정보 업데이트
    // 유저 정보를 JSON 문자열로 변환하여 저장
    await redis.addRedisToHash(`room:${roomData.id}`, { ...roomData, users: JSON.stringify(roomData.users) });

    // 유저 정보 업데이트
    const userData = await redis.getAllFieldsFromHash(`user:${user.id}`);
    const updatedData = { ...userData, joinRoom: roomData.id };
    await redis.addRedisToHash(`user:${user.id}`, updatedData);

    // Session에 유저 joinRoom정보 업데이트
    modifyUserData(user.id, { joinRoom: roomData.id });

    //랜덤매칭에 성공한 경우
    const roomPayload = { joinRandomRoomResponse: { success: true, room: roomData, failCode: failCode.NONE_FAILCODE } };
    socket.write(createResponse(roomPayload, packetType.JOIN_RANDOM_ROOM_RESPONSE, 0));
  } catch (err) {
    handleError(socket, err);
  }
};

/**
 * @desc 방 나가기
 * @author 한우종
 * @todo 참여한 방에서 나가기
 */
export const leaveRoomHandler = async (socket, payload) => {
  try {
    const failCode = GlobalFailCode.values;
    const user = await getUserBySocket(socket);
    const currentUserId = user.id;
    //현재 나가려하는 방의 키값
    const leaveRoomKey = await redis.getRedisToHash(`user:${currentUserId}`, `joinRoom`);
    //나가는 유저의 정보
    const leaveUserInfo = await redis.getRedisToHash(`room:${leaveRoomKey}`, `users`);
    //해당 방의 방장
    const ownerId = await redis.getRedisToHash(`room:${leaveRoomKey}`, `ownerId`);

    if (!user) {
      throw new CustomError(ErrorCodes.UNKNOWN_ERROR, `존재하지 않는 유저입니다.`);
    }

    if (!leaveRoomKey) {
      const roomPayload = { leaveRoomResponse: { success: false, failCode: failCode.LEAVE_ROOM_FAILED } };
      socket.write(createResponse(roomPayload, packetType.LEAVE_ROOM_RESPONSE, 0));

      throw new CustomError(ErrorCodes.LEAVE_ROOM_FAILED, `사용자가 참여하고 있는 방이 없습니다: user:${user.id}`);
    }

    if (!leaveUserInfo) {
      const roomPayload = { leaveRoomResponse: { success: false, failCode: failCode.LEAVE_ROOM_FAILED } };
      socket.write(createResponse(roomPayload, packetType.LEAVE_ROOM_RESPONSE, 0));

      throw new CustomError(ErrorCodes.LEAVE_ROOM_FAILED, `사용자가 참여하고 있는 방이 없습니다: user:${user.id}`);
    }
    //users 필드값
    const users = JSON.parse(leaveUserInfo);

    // 현재 유저의 socket.id에 해당하는 객체의 인덱스를 찾음
    const userIndex = users.findIndex((user) => user.id === currentUserId);
    if (userIndex !== -1) {
      const removeUser = users.splice(userIndex, 1)[0];

      const notification = { leaveRoomNotification: { userId: removeUser.id } };
      sendNotificationToUsers(users, notification, packetType.LEAVE_ROOM_NOTIFICATION, 0);

      const roomOwnerId = removeUser.id === Number(ownerId);
      await redis.updateRedisToHash(leaveRoomKey, 'users', users);

      // Session에 유저 joinRoom정보 업데이트
      modifyUserData(user.id, { joinRoom: null });

      if (roomOwnerId || users.length === 0) {
        // 방 삭제 알림
        const roomPayload = { leaveRoomResponse: { success: true, failCode: failCode.NONE_FAILCODE } };
        sendNotificationToUsers(users, roomPayload, packetType.LEAVE_ROOM_RESPONSE, 0);

        // 모든 사용자 상태 업데이트
        users.forEach(async (user) => {
          await redis.setRedisToHash(`user:${user.id}`, `joinRoom`, null);
        });

        // Redis에서 방 데이터 삭제
        await redis.delRedisByKey(`room:${leaveRoomKey}`);
      }
    }
    const roomPayload = { leaveRoomResponse: { success: true, failCode: failCode.NONE_FAILCODE } };
    socket.write(createResponse(roomPayload, packetType.LEAVE_ROOM_RESPONSE, 0));
  } catch (err) {
    handleError(socket, err);
  }
};
