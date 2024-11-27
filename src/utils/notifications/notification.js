import { getUserById } from '../../sessions/user.session.js';
import { createResponse } from '../response/createResponse.js';

//다중 유저 response or notification에 사용
export const sendNotificationToUsers = (users, payload, notificationType, sequence) => {
  try {
    users.forEach((element) => {
      const otherUser = getUserById(Number(element.id));
      if (otherUser) {
        otherUser.socket.write(createResponse(payload, notificationType, sequence));
      }
    });
  } catch (err) {
    console.error(`sendNotification에러`, err);
  }
};
