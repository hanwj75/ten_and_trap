/**
 * @desc 페이즈 업데이트
 * @author 한우종
 * @todo 특정 시간이 지날때마다 닞/밤 전환 notification을 사용하여 상태동기화
 */

import CharacterPosition from '../../classes/models/characterPosition.class.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { redis } from '../../init/redis/redis.js';
import { getUserBySocket } from '../../sessions/user.session.js';
import CustomError from '../../utils/error/customError.js';
import { ErrorCodes } from '../../utils/error/errorCodes.js';
import { handleError } from '../../utils/error/errorHandler.js';
import { sendNotificationToUsers } from '../../utils/notifications/notification.js';
import { gameEndNotification } from './gameEndHandler.js';

export const phaseUpdateHandler = async (socket, room, nextState) => {
  try {
    if (!room || !nextState) {
      throw new CustomError(ErrorCodes.INVALID_PHASE, `유효하지 않은 room 또는 nextState입니다.`);
    }
    //phase 전환
    const phase = room.phase;

    const users = await JSON.parse(room.users);

    //차후 10장으로 변경
    const isWinner = users.findIndex((user) => user.character.handCardsCount > 5);

    if (phase === '3') {
      console.log(`낮으로 전환합니다. 현재 PhaseType: ${phase}.`);
      await redis.updateRedisToHash(room.id, `phase`, 1);

      if (isWinner !== -1) {
        gameEndNotification(socket, room.id);
      }
    } else if (phase === '1') {
      console.log(`밤으로 전환합니다. 현재 PhaseType: ${phase}.`);
      await redis.updateRedisToHash(room.id, `phase`, 3);
    }
    const phaseType = phase === '3' ? '1' : '3';
    let nextPhaseAt = Date.now() + nextState;
    const notification = { phaseUpdateNotification: { phaseType, nextPhaseAt, CharacterPosition } };
    sendNotificationToUsers(users, notification, PACKET_TYPE.PHASE_UPDATE_NOTIFITION, 0);
  } catch (err) {
    handleError(socket, err);
  }
};

/**
 * @desc 인터벌 제한 버튼
 * @author 한우종
 * @todo 게임 시작시 false로 변환하여 하나의 인터벌만 들어오도록 허용
 */
export const button = async (socket) => {
  try {
    const user = await getUserBySocket(socket);
    const currentUserId = user.id;

    if (!user) {
      throw new CustomError(ErrorCodes.UNKNOWN_ERROR, `존재하지 않는 사용자 입니다.`);
    }

    const roomId = await redis.getRedisToHash(`user:${currentUserId}`, `joinRoom`);
    const isPushed = await redis.getAllFieldsFromHash(`room:${roomId}`, `isPushed`);

    if (!roomId) {
      throw new CustomError(ErrorCodes.ROOM_NOT_FOUND, `사용자가 참여 중인 방을 찾을 수 없습니다.`);
    }

    if (isPushed) {
      await startCustomInterval(socket, roomId);
      await redis.setRedisToHash(`room:${roomId}`, `isPushed`, false);
    }
  } catch (err) {
    handleError(socket, err);
  }
};
export const startCustomInterval = async (socket, roomId) => {
  try {
    const intervals = [500000, 5000];
    let currentIndex = 0;
    const runInterval = async () => {
      const room = await redis.getAllFieldsFromHash(`room:${roomId}`);

      if (!room) {
        throw new CustomError(ErrorCodes.ROOM_NOT_FOUND, `방 정보를 찾을 수 없습니다.`);
      }
      const users = room.users ? JSON.parse(room.users) : [];
      // 유저가 없으면 인터벌 중지
      if (users.length === 0) {
        console.log('방에 유저가 없으므로 인터벌을 중지합니다.');
        return;
      }

      // 다음 인터벌 설정
      currentIndex = (currentIndex + 1) % intervals.length;
      const nextState = intervals[currentIndex];
      phaseUpdateHandler(socket, room, nextState);
      setTimeout(runInterval, nextState);
    };
    setTimeout(runInterval, intervals[currentIndex]);
  } catch (err) {
    handleError(socket, err);
  }
};
