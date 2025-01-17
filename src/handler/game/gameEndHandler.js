import { PACKET_TYPE } from '../../constants/header.js';
import { redisInit } from '../../init/initData.js';
import { addGold, addRankPoint } from '../../db/user/user.db.js';
import { WinType } from '../../init/loadProto.js';
import { redis } from '../../init/redis/redis.js';
import { modifyUserData } from '../../sessions/user.session.js';
import { sendNotificationToUsers } from '../../utils/notifications/notification.js';
import { getRemoveQueue, queuesSessions } from '../../init/redis/bull/bull.js';

export const gameEndNotification = async (socket, roomId) => {
  try {
    const room = await redis.getAllFieldsFromHash(`room:${roomId}`);

    const userData = await JSON.parse(room.users);

    const winners = [];

    userData.forEach((user) => {
      //차후 10장으로 변경
      if (+user.character.handCardsCount == 10) {
        winners.push(user.id);
      }
    });

    const notification = { gameEndNotification: { winners, winType: WinType.values.PSYCHOPATH_WIN } };

    sendNotificationToUsers(userData, notification, PACKET_TYPE.GAME_END_NOTIFICATION, 0);

    const removeQueue = await getRemoveQueue();
    await removeQueue(`${roomId}room-queue`);

    winners.forEach(async (user) => {
      await addGold(user);
      await addRankPoint(user);
    });

    const endUsersId = userData.map((user) => {
      return user.id;
    });

    endUsersId.forEach(async (userId) => {
      await redis.addRedisToHash(`user:${userId}`, redisInit); // redis 초기화
      await modifyUserData(userId, { joinRoom: null }); // userSession 초기화
    });

    const currentQueue = await queuesSessions.find((queue) => queue.roomId == roomId);
    const currentQueueIndex = queuesSessions.findIndex((queue) => queue.roomId == roomId);
    await currentQueue.obliterate({ force: true });
    await currentQueue.close();
    await redis.delRedisByKey(`bull:${roomId}room-queue:id`);
    if (currentQueueIndex !== -1) {
      queuesSessions.splice(currentQueueIndex, 1);
    }

    await redis.delRedisByKey(`room:${roomId}`);
  } catch (err) {
    console.error(`게임 엔드 에러`, err);
  }
};

export const gameOnEndNotification = async (roomId) => {
  try {
    const room = await redis.getAllFieldsFromHash(`room:${roomId}`);

    const users = await JSON.parse(room.users);

    // 승자 배열을 빈 배열로 유지
    const winners = [];

    // 게임 종료 알림을 빈 승자 배열과 함께 전송
    const notification = { gameEndNotification: { winners, winType: WinType.values.NONE_ROLE } };

    // 모든 유저에게 게임 종료 알림 전송
    sendNotificationToUsers(users, notification, PACKET_TYPE.GAME_END_NOTIFICATION, 0);

    const endUsersId = users.map((user) => {
      return user.id;
    });

    endUsersId.forEach(async (userId) => {
      await redis.addRedisToHash(`user:${userId}`, redisInit); // redis 초기화
      await modifyUserData(userId, { joinRoom: null }); // userSession 초기화
    });

    const removeQueue = await getRemoveQueue();
    await removeQueue(`${roomId}room-queue`);

    const currentQueue = await queuesSessions.find((queue) => queue.roomId == roomId);
    const currentQueueIndex = queuesSessions.findIndex((queue) => queue.roomId == roomId);
    await currentQueue.obliterate({ force: true });
    await currentQueue.close();
    await redis.delRedisByKey(`bull:${roomId}room-queue:id`);
    if (currentQueueIndex !== -1) {
      queuesSessions.splice(currentQueueIndex, 1);
    }

    // Redis에서 방 데이터 삭제
    await redis.delRedisByKey(`room:${roomId}`);
  } catch (err) {
    console.error(`게임 onEnd 에러`, err);
  }
};
