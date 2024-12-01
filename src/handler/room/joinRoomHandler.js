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
