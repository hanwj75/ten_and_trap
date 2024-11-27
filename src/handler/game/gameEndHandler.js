// message S2CGameEndNotification {
//   string loser = 1;
//   string winner = 2;
// }

// message S2CGameEndNotification {
//   repeated int64 winners = 1;
//   WinType winType = 2;
// }

import { packetType } from '../../constants/header.js';
import { redis } from '../../init/redis/redis.js';
import { modifyUserData } from '../../sessions/user.session.js';
import { sendNotificationToUsers } from '../../utils/notifications/notification.js';

export const gameEndNotification = async (roomId) => {
  try {
    const room = await redis.getAllFieldsFromHash(`room:${roomId}`);

    console.log('gameEnd 들어옴');

    const phaseData = room.phase;

    const userData = await JSON.parse(room.users);

    const winners = [];

    //페이즈가 아침일 경우 유저데이터를 조회해 카드가 10장인 유저를 winners배열에 집어넣는다
    if (+phaseData === 1) {
      userData.forEach((user) => {
        if (+user.character.handCardsCount === 2) {
          winners.push(user.id);
        }
      });
    }
    console.log(winners);
    //   //winners 배열에 유저id가 존재할경우 나머지 유저들의 id를 losers에 집어넣는다
    //   if (winners.length > 0) {
    //     userData.forEach((user) => {
    //       if (+user.character.handCardsCount !== 10) {
    //         losers.push(user.id);
    //       }
    //     });
    //   }
    // }

    const gameEndNotificationPaylode = {
      gameEndNotification: {
        winners,
        winType: 0,
      },
    };

    sendNotificationToUsers(
      userData,
      gameEndNotificationPaylode,
      packetType.GAME_END_NOTIFICATION,
      0,
    );

    await redis.delRedisByKey(`room:${roomId}`);
    await modifyUserData();
  } catch (error) {
    console.error(error);
  }
};
