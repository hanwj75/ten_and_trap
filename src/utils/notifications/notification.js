import { getUserById } from '../../sessions/user.session.js';
import { createResponse } from '../response/createResponse.js';

export const sendNotificationToUsers = (users, payload, notificationType, sequence) => {
  users.forEach((element) => {
    const otherUser = getUserById(Number(element.id));
    if (otherUser) {
      otherUser.socket.write(createResponse(payload, notificationType, sequence));
    }
  });
};
