import { PACKET_TYPE } from '../../constants/header.js';
import { redis } from '../../init/redis/redis.js';
import { sendNotificationToUsers } from '../../utils/notifications/notification.js';
export const drawCard = async (userId, roomData) => {
  try {
    const user = await redis.getAllFieldsFromHash(`user:${userId}`);
    user.handCards = JSON.parse(user.handCards);
    const randomType = Math.floor(Math.random() * 7) + 1;
    const existType = user.handCards.find((card) => card.type === randomType);

    if (existType) {
      existType.count++;
    } else {
      user.handCards.push({ type: randomType, count: 1 });
    }
    user.handCardsCount++;

    roomData.users = JSON.parse(roomData.users);
    const updateRoomData = roomData.users.find((user) => user.id == userId);
    updateRoomData.character.handCards = user.handCards;
    updateRoomData.character.handCardsCount = user.handCardsCount;
    const updatedRoomData = { ...roomData, users: JSON.stringify(roomData.users) };
    await redis.addRedisToHash(`room:${roomData.id}`, updatedRoomData);

    const updatedUserData = {
      ...user,
      handCards: JSON.stringify(user.handCards),
      handCardsCount: user.handCardsCount,
    };
    await redis.addRedisToHash(`user:${user.id}`, updatedUserData);

    const userNotification = { userUpdateNotification: { user: roomData.users } };
    sendNotificationToUsers(roomData.users, userNotification, PACKET_TYPE.USER_UPDATE_NOTIFICATION, 0);
  } catch (err) {
    console.error(`드로우 에러`, err);
  }
};
