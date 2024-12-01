import { packetType } from '../../constants/header.js';
import { GlobalFailCode, CardType } from '../../init/loadProto.js';
import { redis } from '../../init/redis/redis.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { getUserBySocket, getUserById, modifyUserData } from '../../sessions/user.session.js';
import { drawThreeCard } from './cardType/drawThreeCard.js';
import { stealTwoCard } from './cardType/stealTwoCard.js';
import { sendNotificationToUsers } from '../../utils/notifications/notification.js';
import { throwAwayYourCard } from './cardType/throwAwayYourCard.js';
import { throwAwayMyCard } from './cardType/throwAwayMyCard.js';
import CustomError from '../../utils/error/customError.js';
import { ErrorCodes } from '../../utils/error/errorCodes.js';
import { handleError } from '../../utils/error/errorHandler.js';

/**
 * @dest 카드 사용 요구
 * @author 박건순
 * @todo 카드 사용 검증하기
 */
export const useCardHandler = async (socket, payload) => {
  try {
    const { cardType, targetUserId } = payload.useCardRequest;
    const failCode = GlobalFailCode.values;

    // 카드 쓴 사람
    const user = await getUserBySocket(socket);

    if (!user) {
      throw new CustomError(ErrorCodes.UNKNOWN_ERROR, `존재하지 않는 유저입니다.`);
    }

    const userData = await redis.getAllFieldsFromHash(`user:${user.id}`);
    const roomData = await redis.getAllFieldsFromHash(`room:${userData.joinRoom}`);
    roomData.users = await JSON.parse(roomData.users);

    // 상대방
    let opponent = 0;
    if (targetUserId != 0) {
      opponent = await redis.getAllFieldsFromHash(`user:${targetUserId}`);
      if (!opponent) {
        throw new CustomError(ErrorCodes.CHARACTER_NOT_FOUND, `존재하지 않는 상대입니다.`);
      }
    }

    // 카드타입이 존재하는 카드인지
    let cardTypeKey = Object.keys(CardType.values).find((key) => CardType.values[key] === cardType);
    if (!cardTypeKey) {
      const cardPayload = { useCardResponse: { success: false, failCode: failCode.INVALID_REQUEST } };
      socket.write(createResponse(cardPayload, packetType.USE_CARD_RESPONSE, 0));

      throw new CustomError(ErrorCodes.CHARACTER_NO_CARD, `존재하지 않는 카드`);
    }
    // 손에 카드 있는지 검증
    userData.handCards = JSON.parse(userData.handCards);
    if (!userData.handCards.some((card) => card.type === cardType)) {
      const cardPayload = { useCardResponse: { success: false, failCode: failCode.CHARACTER_NO_CARD } };
      socket.write(createResponse(cardPayload, packetType.USE_CARD_RESPONSE, 0));

      throw new CustomError(ErrorCodes.CHARACTER_NO_CARD, `손에 해당 카드가 없습니다.`);
    }

    // 사용한 카드 삭제
    for (let i = 0; i < userData.handCards.length; i++) {
      if (userData.handCards[i].type === cardType) {
        userData.handCards[i].count -= 1;
        userData.handCardsCount--;
        if (userData.handCards[i].count <= 0) {
          userData.handCards.splice(i, 1);
        }
        break;
      }
    }
    // 카드별 함수 실행
    switch (cardType) {
      case 1:
        stealTwoCard(userData, opponent, roomData); // 여기는 타켓의 카드를 뺏는 카드로 만들 예정
        break;
      case 2:
        drawThreeCard(userData);
        break;
      case 3:
        throwAwayMyCard(userData);
        break;
      case 4:
        throwAwayYourCard(opponent, roomData);
        break;
      default:
        throw new CustomError(ErrorCodes.INVALID_REQUEST, `잘못된 카드 타입입니다.`);
    }

    const updateRoomData = roomData.users.find((user) => user.id == userData.id);
    updateRoomData.character.handCards = userData.handCards;
    updateRoomData.character.handCardsCount = userData.handCardsCount;

    const updatedRoomData = { ...roomData, users: JSON.stringify(roomData.users) };
    await redis.addRedisToHash(`room:${roomData.id}`, updatedRoomData);

    const handCards = JSON.stringify(userData.handCards);
    const updatedUserData = { ...userData, handCards, handCardsCount: userData.handCardsCount };
    await redis.addRedisToHash(`user:${user.id}`, updatedUserData);

    // 나에게 카드 사용 알림
    const cardPayload = { useCardResponse: { success: true, failCode: failCode.NONE_FAILCODE } };
    socket.write(createResponse(cardPayload, packetType.USE_CARD_RESPONSE, 0));

    // 방에 있는 모두에게 카드 사용 알림
    const cardNotification = { useCardNotification: { cardType: cardType, userId: user.id, targetUserId: targetUserId } };
    sendNotificationToUsers(roomData.users, cardNotification, packetType.USE_CARD_NOTIFICATION, 0);

    const userNotification = { userUpdateNotification: { user: roomData.users } };
    sendNotificationToUsers(roomData.users, userNotification, packetType.USER_UPDATE_NOTIFICATION, 0);
  } catch (err) {
    handleError(socket, err);
  }
};
