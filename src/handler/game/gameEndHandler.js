import { packetType } from '../../constants/header.js';
import { redisInit, sessionCharacterPosition, sessionInit, sessionJoinRoom } from '../../constants/userInit.js';
import { addGold, addRankPoint } from '../../db/user/user.db.js';
import { WinType } from '../../init/loadProto.js';
import { redis } from '../../init/redis/redis.js';
import { getAllUser, modifyUserData } from '../../sessions/user.session.js';
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

    const endUsersId = userData.map((user) => {
      return user.id;
    });

    const aaa = await getAllUser();
    // console.log('aaatest : ',aaa);
    console.log('previous aaa[0] test : ', aaa[0]);

    endUsersId.forEach(async (userId) => {
      await redis.addRedisToHash(`user:${userId}`, redisInit); // redis 초기화
      await modifyUserData(Number(userId), { ...sessionInit, joinRoom: null }); // userSession 초기화
      // await modifyUserData(Number(userId), { joinRoom: null });
      // await modifyUserData(Number(userId), { sessionCharacterPosition });
    });

    const bbb = await getAllUser();
    console.log('after bbb[0] test : ', bbb[0]);
    console.log('after bbb[0] test : ', bbb[0].character);

    await redis.delRedisByKey(`room:${roomId}`);
  } catch (error) {
    console.error(error);
  }
};
