import { getUserBySocket, modifyUserData } from '../../sessions/user.session.js';
import { GlobalFailCode } from '../../init/loadProto.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { packetType } from '../../constants/header.js';
import { redis } from '../../init/redis/redis.js';
import { sendNotificationToUsers } from '../../utils/notifications/notification.js';
import { handleError } from '../../utils/error/errorHandler.js';
import { ErrorCodes } from '../../utils/error/errorCodes.js';
import CustomError from '../../utils/error/customError.js';

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
