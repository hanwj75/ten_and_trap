import { getUserBySocket, removeUser } from '../sessions/user.session.js';
import { redis } from '../init/redis/redis.js';
import { sendNotificationToUsers } from '../utils/notifications/notification.js';
import { PACKET_TYPE } from '../constants/header.js';
import { GlobalFailCode } from '../init/loadProto.js';
import { gameOnEndNotification } from '../handler/game/gameEndHandler.js';
import CustomError from '../utils/error/customError.js';
import { ErrorCodes } from '../utils/error/errorCodes.js';
import { handleError } from '../utils/error/errorHandler.js';

export const onEnd = (socket) => async () => {
  try {
    console.log('클라이언트 연결이 종료되었습니다.');
    const failCode = GlobalFailCode.values;
    /**
     * @desc 클라이언트 종료시 방 나가기 OR 데이터 삭제
     * @author 한우종
     */
    const user = await getUserBySocket(socket);
    if (!user) {
      throw new CustomError(ErrorCodes.UNKNOWN_ERROR, `존재하지 않는 유저입니다.`);
    }
    const currentUserId = user.id;
    await removeUser(socket);
    //현재 나가려하는 방의 키값
    const leaveRoomKey = await redis.getRedisToHash(`user:${currentUserId}`, `joinRoom`);
    //나가는 유저의 정보
    const leaveUserInfo = await redis.getRedisToHash(`room:${leaveRoomKey}`, `users`);
    //해당 방의 방장
    const ownerId = await redis.getRedisToHash(`room:${leaveRoomKey}`, `ownerId`);
    //현재 방 정보
    const roomData = await redis.getAllFieldsFromHash(`room:${leaveRoomKey}`);

    const users = JSON.parse(leaveUserInfo);

    // if (!user) {
    //   throw new CustomError(ErrorCodes.UNKNOWN_ERROR, `존재하지 않는 유저입니다.`);
    // }

    // 현재 유저의 socket.id에 해당하는 객체의 인덱스를 찾음

    const userIndex = users.findIndex((user) => user.id === currentUserId);
    if (userIndex !== -1) {
      const removedUser = users.splice(userIndex, 1)[0];
      const roomOwnerId = removedUser.id === Number(ownerId);
      if (roomData.state === '2' && removedUser.character.hp > 0) {
        // 종료한 유저의 HP를 0으로 설정
        removedUser.character.hp = 0;

        users.push(removedUser);
        // Redis에 사용자 목록을 업데이트
        await redis.updateRedisToHash(leaveRoomKey, 'users', users); // 중복된 JSON.stringify 제거

        // Redis에서 갱신된 데이터를 다시 로드
        const updatedUsers = JSON.parse(await redis.getRedisToHash(`room:${leaveRoomKey}`, 'users'));

        // 체력 업데이트 알림 전송
        const userNotification = { userUpdateNotification: { user: updatedUsers } }; // 모든 유저 정보 포함
        sendNotificationToUsers(updatedUsers, userNotification, PACKET_TYPE.USER_UPDATE_NOTIFICATION, 0);

        // 나간 유저를 배열에서 제거
        const updatedUserIndex = users.findIndex((user) => user.id === removedUser.id);
        if (updatedUserIndex !== -1) {
          await users.splice(updatedUserIndex, 1); // 나간 유저를 배열에서 제거
        }

        // Redis에 최종 업데이트
        await redis.updateRedisToHash(leaveRoomKey, 'users', users); // 중복된 JSON.stringify 제거
      }
      const notification = { leaveRoomNotification: { userId: removedUser.id } };
      sendNotificationToUsers(users, notification, PACKET_TYPE.LEAVE_ROOM_NOTIFICATION, 0);

      // await redis.updateRedisToHash(leaveRoomKey, 'users', users);
      if (roomOwnerId) {
        const roomPayload = { leaveRoomResponse: { success: true, failCode: failCode.NONE_FAILCODE } };
        sendNotificationToUsers(users, roomPayload, PACKET_TYPE.LEAVE_ROOM_RESPONSE, 0);

        if (roomData.state === '2') {
          await gameOnEndNotification(leaveRoomKey);
        }
        // Redis에서 방 데이터 삭제
        await redis.delRedisByKey(`room:${leaveRoomKey}`);
      }
      await redis.delRedisByKey(`user:${currentUserId}`);
    }
  } catch (err) {
    handleError(socket, err);
  }
};
