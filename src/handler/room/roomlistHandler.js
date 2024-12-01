import { createResponse } from '../../utils/response/createResponse.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { redis } from '../../init/redis/redis.js';
import { handleError } from '../../utils/error/errorHandler.js';
/**
 * @desc 방 리스트 조회
 * @author 박건순
 * @todo 현재 존재하는 방 목록 보여주기
 */
export const getRoomListHandler = async (socket, payload) => {
  try {
    const roomKeys = await redis.getRedisToKeys('room:*'); // 모든 방 키를 가져옴

    let allRooms = [];
    if (roomKeys.length > 0) {
      allRooms = await redis.getAllFieldsByValue(roomKeys, 'state', '0');
    }
    const roomPayload = { getRoomListResponse: { rooms: allRooms } };
    socket.write(createResponse(roomPayload, PACKET_TYPE.GET_ROOMLIST_RESPONSE, 0));
  } catch (err) {
    handleError(socket, err);
  }
};
