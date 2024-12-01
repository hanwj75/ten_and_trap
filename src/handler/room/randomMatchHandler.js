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
