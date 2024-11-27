import { packetType } from '../../constants/header.js';
import { GlobalFailCode, CardType } from '../../init/loadProto.js';
import { redis } from '../../init/redis/redis.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { getUserBySocket, getUserById, modifyUserData } from '../../sessions/user.session.js';
import { drawThreeCard } from './cardType/drawThreeCard.js';
import { sendNotificationToUsers } from '../../utils/notifications/notification.js';
/**
 * @dest 카드 사용 요구
 * @author 박건순
 * @todo 카드 사용 검증하기
message S2CUseCardResponse { // 성공 여부만 반환하고 대상 유저 효과는 S2CUserUpdateNotification로 통지
    bool success = 1;
    GlobalFailCode failCode = 2;
    }
    
message S2CUseCardNotification {
    CardType cardType = 1;
    int64 userId = 2;
    int64 targetUserId = 3; // 타겟 없으면 0
    }
enum CardType {
    NONE = 0;
    BBANG = 1; // 20장
    BIG_BBANG = 2; // 1장
    SHIELD = 3; // 10장
    VACCINE = 4; // 6장
    CALL_119 = 5; // 2장
    DEATH_MATCH = 6; // 4장
    GUERRILLA = 7; // 1장
    ABSORB = 8; // 4장
    HALLUCINATION = 9; // 4장
    FLEA_MARKET = 10; // 3장
    MATURED_SAVINGS = 11; // 2장
    WIN_LOTTERY = 12; // 1장
    SNIPER_GUN = 13; // 1장
    HAND_GUN = 14; // 2장
    DESERT_EAGLE = 15; // 3장
    AUTO_RIFLE = 16; // 2장
    LASER_POINTER = 17; // 1장
    RADAR = 18; // 1장
    AUTO_SHIELD = 19; // 2장
    STEALTH_SUIT = 20; // 2장
    CONTAINMENT_UNIT = 21; // 3장
    SATELLITE_TARGET = 22; // 1장
    BOMB = 23; // 1장
}
카드는 json형식으로 서버와 클라에 저장해놓고 쓸 수 있게

*/

export const useCardHandler = async (socket, payload) => {
  try {
    const { cardType, targetUserId } = payload.useCardRequest;

    // 카드 쓴 사람
    const user = await getUserBySocket(socket);
    const userData = await redis.getAllFieldsFromHash(`user:${user.id}`);
    const roomData = await redis.getAllFieldsFromHash(`room:${userData.joinRoom}`);
    roomData.users = await JSON.parse(roomData.users);

    // 상대방
    let opponent = 0;
    if (targetUserId != 0) {
      opponent = await getUserById(Number(targetUserId));
    }

    // 카드타입이 존재하는 카드인지
    let cardTypeKey = Object.keys(CardType.values).find((key) => CardType.values[key] === cardType);
    if (!cardTypeKey) {
      const useCardResponse = {
        useCardResponse: {
          success: false,
          failCode: GlobalFailCode.values.INVALID_REQUEST,
        },
      };
      socket.write(createResponse(useCardResponse, packetType.USE_CARD_RESPONSE, 0));
      console.error('존재하지않는 카드');
    }
    // 손에 카드 있는지 검증
    userData.handCards = JSON.parse(userData.handCards);
    if (!userData.handCards.some((card) => card.type === cardType)) {
      const useCardResponse = {
        useCardResponse: {
          success: false,
          failCode: GlobalFailCode.values.CHARACTER_NO_CARD,
        },
      };
      socket.write(createResponse(useCardResponse, packetType.USE_CARD_RESPONSE, 0));
      console.error('손에 카드 없음');
    }

    // 카드별 함수 실행
    switch (cardType) {
      case 1:
        drawThreeCard(userData);
        break;
      default:
        console.log('default');
        break;
    }

    // Todo 카드함수에 넣을 생각도 해보는중
    // 유저 정보 업데이트
    for (let i = 0; i < userData.handCards.length; i++) {
      if (userData.handCards[i].type === cardType) {
        userData.handCards[i].count -= 1;
        if (userData.handCards[i].count <= 0) {
          userData.handCards.splice(i, 1);
        }
        break;
      }
    }
    const updateRoomData = roomData.users.find((user) => user.id == userData.id);
    updateRoomData.character.handCards = userData.handCards;
    updateRoomData.character.handCardsCount = userData.handCardsCount;
    const updatedRoomData = {
      ...roomData,
      users: JSON.stringify(roomData.users),
    };
    await redis.addRedisToHash(`room:${roomData.id}`, updatedRoomData);

    userData.handCardsCount--;
    const updatedUserData = {
      ...userData,
      handCards: JSON.stringify(userData.handCards),
      handCardsCount: userData.handCardsCount,
    };
    await redis.addRedisToHash(`user:${user.id}`, updatedUserData);

    console.log('test111:' + JSON.stringify(userData.handCards));
    // Session에 유저 정보 업데이트
    modifyUserData(user.id, {
      character: {
        handCards: userData.handCards,
        handCardsCount: userData.handCardsCount,
      },
    });

    // 나에게 카드 사용 알림
    const useCardResponse = {
      useCardResponse: {
        success: true,
        failCode: GlobalFailCode.values.NONE_FAILCODE,
      },
    };
    socket.write(createResponse(useCardResponse, packetType.USE_CARD_RESPONSE, 0));

    // 방에 있는 모두에게 카드 사용 알림
    const useCardNotificationPayload = {
      useCardNotification: {
        cardType: cardType,
        userId: user.id,
        targetUserId: targetUserId,
      },
    };

    sendNotificationToUsers(
      roomData.users,
      useCardNotificationPayload,
      packetType.USE_CARD_NOTIFICATION,
      0,
    );

    const userInfoData = await getUserBySocket(socket);
    const userInfo = {
      id: userInfoData.id,
      nickname: userInfoData.nickName,
      character: userInfoData.character,
    };

    console.log('test1111:' + JSON.stringify(userInfo.character));
    const userUpdateNotificationPayload = {
      userUpdateNotification: {
        user: roomData.users,
      },
    };

    sendNotificationToUsers(
      roomData.users,
      userUpdateNotificationPayload,
      packetType.USER_UPDATE_NOTIFICATION,
      0,
    );
  } catch (err) {
    console.error('카드 사용 에러:', err);
  }
};
