import { packetType } from '../../constants/header';
import { GlobalFailCode } from '../../init/loadProto';
import { redis } from '../../init/redis/redis';
import { createResponse } from '../response/createResponse';

/**
 * @desc 유저 상태 업데이트
 * @author 박건순
 * 
 * 유저의 정보 업데이트 시 알림
 * 방에 있는 모두에게
 * 
message UserData {
    int64 id = 1;
    string nickname = 2;
    CharacterData character = 3;
}
message CharacterData {
    CharacterType characterType = 1;
    RoleType roleType = 2;
    int32 hp = 3;
    int32 weapon = 4;
    CharacterStateInfoData stateInfo = 5;
    repeated int32 equips = 6;
    repeated int32 debuffs = 7;
    repeated CardData handCards = 8;
    int32 bbangCount = 9;
    int32 handCardsCount = 10;
}

message S2CUserUpdateNotification {
    repeated UserData user = 1;
}
*/

export const userUpdateNotification = async (roomId, userData) => {
  try {
    const roomData = await redis.getAllFieldsFromHash(`room:${roomId}`);
    roomData.users = await JSON.parse(roomData.users);

    const userUpdatePayload = {
      userUpdateNotification: {
        user: userData,
      },
    };

    roomData.users.forEach((element) => {
      const user = getUserById(Number(element.id));
      user.socket.write(createResponse(userUpdatePayload, packetType.USER_UPDATE_NOTIFICATION, 0));
    });
  } catch (err) {
    console.err('유저 업데이트 에러:' + err);
  }
};
