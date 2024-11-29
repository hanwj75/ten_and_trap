import { packetType } from '../../constants/header.js';
import { addGold, addRankPoint } from '../../db/user/user.db.js';
import { WinType } from '../../init/loadProto.js';
import { redis } from '../../init/redis/redis.js';
import { modifyUserData } from '../../sessions/user.session.js';
import { sendNotificationToUsers } from '../../utils/notifications/notification.js';

export const gameEndNotification = async (roomId) => {
  try {
    const room = await redis.getAllFieldsFromHash(`room:${roomId}`);

    const userData = await JSON.parse(room.users);

    const winners = [];

    userData.forEach((user) => {
      if (+user.character.handCardsCount === 2) {
        winners.push(user.id);
      }
    });

    const notification = { gameEndNotification: { winners, winType: WinType.values.PSYCHOPATH_WIN } };

    sendNotificationToUsers(userData, notification, packetType.GAME_END_NOTIFICATION, 0);

    winners.forEach(async (user) => {
      await addGold(user);
      await addRankPoint(user);
    });

    await redis.delRedisByKey(`room:${roomId}`);
  } catch (error) {
    console.error(error);
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
    sendNotificationToUsers(users, notification, packetType.GAME_END_NOTIFICATION, 0);

    // Redis에서 방 데이터 삭제
    await redis.delRedisByKey(`room:${roomId}`);
  } catch (error) {
    console.error(error);
  }
};
