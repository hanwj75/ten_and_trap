import { packetType } from '../../constants/header.js';
import { GlobalFailCode } from '../../init/loadProto.js';
import { redis } from '../../init/redis/redis.js';
import { getUserBySocket } from '../../sessions/user.session.js';
import { createResponse } from '../../utils/response/createResponse.js';

export const gamePrepareHandler = async (socket) => {
  try {
    // request한 socket사용해서 session에서 방장 정보 조회
    const owner = await getUserBySocket(socket);

    // redis에서 room 조회
    const room = await redis.getAllFieldsFromHash(`room:${owner.id}`);

    console.log(room);

    // // redis에서 조회한 room들 중에서 ownerId가 socket owner.id와 같은 room 찾기
    // const existRoom = rooms.find((room) => room.ownerId === owner.id);

    // // 만약 지금 socket host가 존재하는 방이 없다면 fail 처리
    // if (!existRoom) {
    //   const responsePayload = {
    //     gamePrepareResponse: {
    //       success: false,
    //       failCode: GlobalFailCode.values.NOT_ROOM_OWNER,
    //     },
    //   };
    //   const response = createResponse(responsePayload, packetType.GAME_PREPARE_RESPONSE, 0);
    //   socket.write(response);
    //   return;
    // }

    // // response
    // const responsePayload = {
    //   gamePrepareResponse: {
    //     success: true,
    //     failCode: GlobalFailCode.values.NONE_FAILCODE,
    //   },
    // };
    // const response = createResponse(responsePayload, packetType.GAME_PREPARE_RESPONSE, 0);
    // socket.write(response);

    // // state 제외한 정보 추출
    // const { id, ownerId, name, maxUserNum, users } = existRoom;

    // // state 준비 단계로 update // 대기 = 0, 준비 = 1, 시작 = 2
    // const stateUpdatedRoom = {
    //   id,
    //   ownerId,
    //   name,
    //   maxUserNum,
    //   state: 1,
    //   users,
    // };

    // // redis에 저장
    // await redis.setRedis(`room:${id}`, JSON.stringify(stateUpdatedRoom));

    // const notificationPayload = {
    //   gamePrepareNotification: {
    //     room: stateUpdatedRoom,
    //   },
    // };

    // const notification = createResponse(
    //   notificationPayload,
    //   packetType.GAME_PREPARE_NOTIFICATION,
    //   0,
    // );

    // // host 제외한 유저들에게 notification
    // users.forEach((user) => {
    //   if (user.id !== owner.id) {
    //     const userSocket = getUserBySocket(user.socket);
    //     userSocket.write(notification);
    //   }
    // });
  } catch (error) {
    console.error(error);
  }
};
