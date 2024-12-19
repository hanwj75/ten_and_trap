import { PACKET_TYPE } from '../../constants/header.js';
import { stateInitData } from '../../init/initData.js';
import { GlobalFailCode } from '../../init/loadProto.js';
import { redis } from '../../init/redis/redis.js';
import { getUserBySocket } from '../../sessions/user.session.js';
import CustomError from '../../utils/error/customError.js';
import { ErrorCodes } from '../../utils/error/errorCodes.js';
import { handleError } from '../../utils/error/errorHandler.js';
import { sendNotificationToUsers } from '../../utils/notifications/notification.js';
import { createResponse } from '../../utils/response/createResponse.js';
/**
 * @dest 카드 카운터
 * @author 박건순
 *
 **/

export const reactionHandler = async (socket, payload) => {
  try {
    const { reactionType } = payload.reactionRequest;
    const failCode = GlobalFailCode.values;

    // reaction하는 유저
    const user = await getUserBySocket(socket);
    const userData = await redis.getAllFieldsFromHash(`user:${user.id}`);
    userData.stateInfo = await JSON.parse(userData.stateInfo);

    const roomData = await redis.getAllFieldsFromHash(`room:${userData.joinRoom}`);
    roomData.users = await JSON.parse(roomData.users);

    const curState = userData.stateInfo.state;
    const opponentData = await redis.getAllFieldsFromHash(`user:${userData.stateInfo.stateTargetUserId}`);

    switch (curState) {
      case 0:
        break;
      case 2: // "내놔" 맞은 사람
        stealedCardFunction(opponentData, userData, roomData);
        break;
      case 8: // "모두 버려" 맞은 사람
        throwAwayCardFunction(opponentData, userData, roomData, false);
        break;
      case 16: // "버려" 맞은 사람
        throwAwayCardFunction(opponentData, userData, roomData, false);
        break;
      case 17: // "다 버려" 맞은 사람
        throwAwayCardFunction(opponentData, userData, roomData, true);
        break;
      default:
        const reactionPayload = { success: false, failCode: failCode.INVALID_REQUEST };
        socket.write(createResponse(reactionPayload, PACKET_TYPE.REACTION_RESPONSE, 0));

        throw new CustomError(ErrorCodes.INVALID_REQUEST, `잘못된 유저상태입니다.`);
    }

    // redis에 유저 정보 업데이트
    const updateRoomData = roomData.users.find((user) => user.id == userData.id);
    updateRoomData.character.handCards = userData.handCards;
    updateRoomData.character.handCardsCount = userData.handCardsCount;
    updateRoomData.character.stateInfo = stateInitData;
    const updatedRoomData = { ...roomData, users: JSON.stringify(roomData.users) };
    await redis.addRedisToHash(`room:${roomData.id}`, updatedRoomData);

    const updatedUserData = {
      ...userData,
      stateInfo: JSON.stringify(stateInitData),
      handCards: JSON.stringify(userData.handCards),
      handCardsCount: userData.handCardsCount,
    };
    await redis.addRedisToHash(`user:${userData.id}`, updatedUserData);

    // 유저정보 업데이트 알림
    const userNotification = { userUpdateNotification: { user: roomData.users } };
    sendNotificationToUsers(roomData.users, userNotification, PACKET_TYPE.USER_UPDATE_NOTIFICATION, 0);

    // reaction 알림
    const reactionPayload = { reactionResponse: { success: true, failCode: failCode.NONE_FAILCODE } };
    socket.write(createResponse(reactionPayload, PACKET_TYPE.REACTION_RESPONSE, 0));
  } catch (err) {
    handleError(null, err);
  }
};

const stealedCardFunction = async (userData, opponentData, roomData) => {
  try {
    const user = userData;
    const opponent = opponentData;
    user.handCards = JSON.parse(user.handCards);
    let opponentHand = opponentData.handCards;
    opponentHand = JSON.parse(opponentHand);
    let opponentCount = opponentData.handCardsCount;

    // 카드 2장 랜덤으로 훔침
    const count = 2;
    const newHandCards = [];

    if (Number(opponentCount) <= count) {
      [...user.handCards, ...opponentHand].forEach((card) => {
        const existType = newHandCards.find((item) => item.type === card.type);
        if (existType) {
          existType.count += card.count;
        } else {
          newHandCards.push({ type: card.type, count: 1 });
        }
      });
      user.handCards = newHandCards;
      user.handCardsCount += opponentCount;
      opponentCount = 0;
      opponentHand = [];
    } else {
      for (let i = 0; i < count; i++) {
        if (opponentCount === 0) break;
        const randomIndex = Math.floor(Math.random() * opponentHand.length);
        const existType = user.handCards.find((card) => card.type === opponentHand[randomIndex].type);

        if (existType) {
          existType.count++;
        } else {
          user.handCards.push({ type: opponentHand[randomIndex].type, count: 1 });
        }
        user.handCardsCount++;
        opponentHand[randomIndex].count--;
        if (opponentHand[randomIndex].count <= 0) {
          opponentHand.splice(randomIndex, 1);
        }
        opponentCount--;
      }
    }

    opponent.handCards = opponentHand;
    opponent.handCardsCount = opponentCount;

    // redis에 유저 정보 업데이트
    const updateRoomData = roomData.users.find((user) => user.id == user.id);
    updateRoomData.character.handCards = user.handCards;
    updateRoomData.character.handCardsCount = user.handCardsCount;
    updateRoomData.character.stateInfo = stateInitData;
    const updatedRoomData = { ...roomData, users: JSON.stringify(roomData.users) };
    await redis.addRedisToHash(`room:${roomData.id}`, updatedRoomData);

    const updatedUserData = {
      ...user,
      stateInfo: JSON.stringify(stateInitData),
      handCards: JSON.stringify(user.handCards),
      handCardsCount: user.handCardsCount,
    };
    await redis.addRedisToHash(`user:${user.id}`, updatedUserData);
    return opponent;
  } catch (err) {
    handleError(null, err);
  }
};

const throwAwayCardFunction = async (userData, opponentData, roomData, isAll) => {
  try {
    const user = userData;
    const opponent = opponentData;
    let opponentHand = opponentData.handCards;
    opponentHand = JSON.parse(opponentHand);
    let opponentCount = opponentData.handCardsCount;

    if (!isAll) {
      const randomIndex = Math.floor(Math.random() * opponentHand.length);

      if (opponentHand[randomIndex]) {
        opponentHand[randomIndex].count--;
        if (opponentHand[randomIndex].count <= 0) {
          opponentHand.splice(randomIndex, 1);
        }
        opponentCount--;
      }
    } else {
      opponentHand = [];
      opponentCount = 0;
    }

    opponent.handCards = opponentHand;
    opponent.handCardsCount = opponentCount;

    // redis에 유저 정보 업데이트
    const updateRoomData = roomData.users.find((user) => user.id == user.id);
    updateRoomData.character.stateInfo = stateInitData;
    const updatedRoomData = { ...roomData, users: JSON.stringify(roomData.users) };
    await redis.addRedisToHash(`room:${roomData.id}`, updatedRoomData);

    const updatedUserData = {
      ...user,
      stateInfo: JSON.stringify(stateInitData),
    };
    await redis.addRedisToHash(`user:${user.id}`, updatedUserData);
    return opponent;
  } catch (err) {
    handleError(null, err);
  }
};
