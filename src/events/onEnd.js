import { getUserBySocket, removeUser } from '../sessions/user.session.js';
import { redis } from '../init/redis/redis.js';
import { sendNotificationToUsers } from '../utils/notifications/notification.js';
import { packetType } from '../constants/header.js';
import { GlobalFailCode } from '../init/loadProto.js';

export const onEnd = (socket) => async () => {
  try {
    console.log('클라이언트 연결이 종료되었습니다.');

    /**
     * @desc 클라이언트 종료시 방 나가기 OR 데이터 삭제
     * @author 한우종
     */
    const user = await getUserBySocket(socket);
    const currentUserId = user.id;
    //현재 나가려하는 방의 키값
    const leaveRequestRoomId = await redis.getRoomByUserId(`user:${currentUserId}`, `joinRoom`);
    //나가는 유저의 정보
    const getLeaveUserId = await redis.getRoomByUserId(`room:${leaveRequestRoomId}`, `users`);
    //해당 방의 방장
    const getOwnerId = await redis.getRoomByUserId(`room:${leaveRequestRoomId}`, `ownerId`);

    const users = JSON.parse(getLeaveUserId);

    if (user) {
      await removeUser(socket);
    } else if (!user) {
      console.error(`존재하지 않는 유저입니다.`);
    }

    // 현재 유저의 socket.id에 해당하는 객체의 인덱스를 찾음
    if (users) {
      const userIndex = users.findIndex((user) => user.id === currentUserId);
      if (userIndex !== -1) {
        const removeUser = users.splice(userIndex, 1)[0];
        const roomOwnerId = removeUser.id === Number(getOwnerId);

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
        await redis.updateUsersToRoom(leaveRequestRoomId, 'users', users);
        if (roomOwnerId) {
          const leaveRoomResponsePayload = {
            leaveRoomResponse: {
              success: true,
              failCode: GlobalFailCode.values.NONE_FAILCODE,
            },
          };
          sendNotificationToUsers(
            users,
            leaveRoomResponsePayload,
            packetType.LEAVE_ROOM_RESPONSE,
            0,
          );

          // Redis에서 방 데이터 삭제
          await redis.delRedisByKey(`room:${leaveRequestRoomId}`);
        }
        await redis.delRedisByKey(`user:${currentUserId}`);
      }
    } else {
      await redis.delRedisByKey(`user:${currentUserId}`);
    }
  } catch (err) {
    console.error(`END에러`, err);
  }
};
