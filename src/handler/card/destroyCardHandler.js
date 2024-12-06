import { PACKET_TYPE } from '../../constants/header.js';
import { redis } from '../../init/redis/redis.js';
import { getUserBySocket } from '../../sessions/user.session.js';
import { sendNotificationToUsers } from '../../utils/notifications/notification.js';
import { createResponse } from '../../utils/response/createResponse.js';

// message S2CDestroyCardResponse {
//     repeated CardData handCards = 1;
// }
export const destroyCardHandler = async (socket, payload) => {
  try {
    const { destroyCards } = payload.destroyCardRequest;
    const user = await getUserBySocket(socket);
    const userData = await redis.getAllFieldsFromHash(`user:${user.id}`);
    userData.handCards = JSON.parse(userData.handCards);

    const existCard = userData.handCards.find((card) => card.type === destroyCards[0].type);
    const cardIndex = userData.handCards.findIndex((card) => card.type === destroyCards[0].type);
    //카드 개수 감소
    if (existCard && existCard.count > 0) {
      existCard.count--;
    }

    //카드 개수가 0 이하일 경우 카드 제거
    if (existCard.count === 0) {
      userData.handCards.splice(cardIndex, 1);
    }
    // handCardsCount를 업데이트
    userData.handCardsCount = userData.handCards.length;

    const destroyCardPayload = { handCards: userData.handCards };
    socket.write(createResponse(destroyCardPayload, PACKET_TYPE.DESTROY_CARD_RESPONSE, 0));

    const roomData = await redis.getAllFieldsFromHash(`room:${userData.joinRoom}`);
    roomData.users = await JSON.parse(roomData.users);

    const updateRoomData = roomData.users.find((u) => u.id == user.id);
    updateRoomData.character.handCards = userData.handCards;
    updateRoomData.character.handCardsCount = userData.handCardsCount;
    const updatedRoomData = { ...roomData, users: JSON.stringify(roomData.users) };
    await redis.addRedisToHash(`room:${roomData.id}`, updatedRoomData);

    const updatedUserData = {
      ...userData,
      handCards: JSON.stringify(userData.handCards),
      handCardsCount: userData.handCardsCount,
    };
    await redis.addRedisToHash(`user:${userData.id}`, updatedUserData);

    const userNotification = { userUpdateNotification: { user: roomData.users } };
    sendNotificationToUsers(roomData.users, userNotification, PACKET_TYPE.USER_UPDATE_NOTIFICATION, 0);
  } catch (err) {
    console.error(`destroyCard 에러`, err);
  }
};
