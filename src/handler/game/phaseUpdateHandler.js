/**
 * @desc 페이즈 업데이트
 * @author 한우종
 * @todo 특정 시간이 지날때마다 닞/밤 전환 notification을 사용하여 상태동기화
 */

import CharacterPosition from '../../classes/models/characterPosition.class.js';
import { packetType } from '../../constants/header.js';
import { redis } from '../../init/redis/redis.js';
import { getUserBySocket } from '../../sessions/user.session.js';
import { sendNotificationToUsers } from '../../utils/notifications/notification.js';
import { gameEndNotification } from './gameEndHandler.js';

export const phaseUpdateHandler = async (room, nextState) => {
  try {
    //phase 전환
    const phase = room.phase;

    const users = await JSON.parse(room.users);

    users.forEach((user) => {
      console.log(user.character.handCardsCount);
    });

    const isWinner = users.findIndex((user) => user.character.handCardsCount === 2);

    if (phase === '3') {
      console.log(`낮으로 전환합니다. 현재 PhaseType: ${phase}.`);
      await redis.updateUsersToRoom(room.id, `phase`, 1);

      if (isWinner !== -1) {
        gameEndNotification(room.id);
      }
    } else if (phase === '1') {
      console.log(`밤으로 전환합니다. 현재 PhaseType: ${phase}.`);
      await redis.updateUsersToRoom(room.id, `phase`, 3);
    }
    const phaseType = phase === '3' ? '1' : '3';
    let nextPhaseAt = Date.now() + nextState;
    const notification = { phaseUpdateNotification: { phaseType, nextPhaseAt, CharacterPosition } };
    sendNotificationToUsers(users, notification, packetType.PHASE_UPDATE_NOTIFITION, 0);
  } catch (err) {
    console.error(`페이즈 전환 에러`, err);
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

    const roomId = await redis.getRoomByUserId(`user:${currentUserId}`, `joinRoom`);
    const isPushed = await redis.getAllFieldsFromHash(`room:${roomId}`, `isPushed`);

    if (isPushed) {
      console.log('button', roomId);
      await startCustomInterval(socket, roomId);
      await redis.setRoomByUserId(`room:${roomId}`, `isPushed`, false);
    }
  } catch (err) {
    console.error(`스위치 에러`, err);
  }
};
export const startCustomInterval = async (socket, roomId) => {
  try {
    const intervals = [5000, 5000];
    let currentIndex = 0;
    const runInterval = async () => {
      const room = await redis.getAllFieldsFromHash(`room:${roomId}`);
      const users = room.users ? JSON.parse(room.users) : []; // 유저 목록 가져오기
      // 유저가 없으면 인터벌 중지
      if (users.length === 0) {
        console.log('방에 유저가 없으므로 인터벌을 중지합니다.');
        return; // 더 이상 진행하지 않음
      }
      console.log('작업 실행: ', currentIndex); // 원하는 작업 수행
      // 다음 인터벌 설정
      currentIndex = (currentIndex + 1) % intervals.length;
      const nextState = intervals[currentIndex];
      phaseUpdateHandler(room, nextState);
      setTimeout(runInterval, nextState);
    };
    setTimeout(runInterval, intervals[currentIndex]);
  } catch (err) {
    console.error(`인터벌 에러`, err);
  }
};
