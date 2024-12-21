import Room from '../../classes/models/room.class.js';
import { getAllUser, getUserBySocket, modifyUserData } from '../../sessions/user.session.js';
import { GlobalFailCode } from '../../init/loadProto.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { redis } from '../../init/redis/redis.js';
import { characterInitData } from '../../init/initData.js';
import { handleError } from '../../utils/error/errorHandler.js';
import { ErrorCodes } from '../../utils/error/errorCodes.js';
import CustomError from '../../utils/error/customError.js';

/**
 * @desc 방 만들기
 * @author 한우종
 * @todo 방 생성하기 요청 들어올시 방 생성해주기
 */
let roomId = 1;
export const createRoomHandler = async (socket, payload) => {
  const failCode = GlobalFailCode.values;
  try {
    const { name, maxUserNum } = payload.createRoomRequest;

    const user = await getUserBySocket(socket);

    if (!user) {
      throw new CustomError(ErrorCodes.UNKNOWN_ERROR, `존재하지 않는 유저입니다.`);
    }

    const userInfo = { id: user.id, nickname: user.nickName, character: characterInitData };

    // 모든 방의 키를 가져옴
    const roomKeys = await redis.getRedisToKeys(`room:*`);
    const ownerId = await redis.getRedisToHash(`user:${user.id}`, `id`);

    // 현재 사용자가 이미 방을 소유하고 있는지 확인
    for (const roomKey of roomKeys) {
      const roomOwnerId = await redis.getRedisToHash(roomKey, `ownerId`);

      if (roomOwnerId === ownerId) {
        const roomPayload = { createRoomResponse: { success: false, room: null, failCode: failCode.CREATE_ROOM_FAILED } };
        socket.write(createResponse(roomPayload, PACKET_TYPE.CREATE_ROOM_RESPONSE, 0));

        throw new CustomError(ErrorCodes.CREATE_ROOM_FAILED, `이미 방을 소유하고 있습니다.`);
      }
    }
    const newRoom = new Room(roomId, user.id, name, maxUserNum, 0, [userInfo], user.id);
    roomId++;

    //redis에 방 정보 저장
    await redis.addRedisToHash(`room:${newRoom.id}`, {
      id: newRoom.id,
      ownerId: newRoom.ownerId,
      name: newRoom.name,
      maxUserNum: newRoom.maxUserNum,
      state: newRoom.state,
      users: JSON.stringify(newRoom.users),
      isPushed: newRoom.isPushed,
      phase: newRoom.phase,
      tagger: newRoom.tagger,
    });

    const userData = await redis.getAllFieldsFromHash(`user:${user.id}`);
    const updatedData = { ...userData, joinRoom: newRoom.id };

    // redis에 유저 joinRoom정보 업데이트
    await redis.addRedisToHash(`user:${user.id}`, updatedData);

    // Session에 유저 joinRoom정보 업데이트
    modifyUserData(user.id, { joinRoom: newRoom.id });

    const roomPayload = { createRoomResponse: { success: true, room: newRoom, failCode: failCode.NONE_FAILCODE } };
    socket.write(createResponse(roomPayload, PACKET_TYPE.CREATE_ROOM_RESPONSE, 0));
  } catch (err) {
    handleError(socket, err);
  }
};
