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

export const phaseUpdateHandler = async (room, nextState) => {
  try {
    //phase 전환
    const phase = room.phase;

    const users = await JSON.parse(room.users);
    if (phase === '3') {
      console.log(`낮으로 전환합니다. 현재 PhaseType: ${phase}.`);
      await redis.updateUsersToRoom(room.id, `phase`, 1);
    } else if (phase === '1') {
      console.log(`밤으로 전환합니다. 현재 PhaseType: ${phase}.`);
      await redis.updateUsersToRoom(room.id, `phase`, 3);
    } else {
      phase === '0';
      return;
    }

    let nextPhaseAt = Date.now() + nextState;
    const pahseUpdatePayload = {
      phaseUpdateNotification: {
        phaseType: phase === '3' ? '1' : '3',
        nextPhaseAt: nextPhaseAt,
        CharacterPosition: CharacterPosition,
      },
    };
    sendNotificationToUsers(users, pahseUpdatePayload, packetType.PHASE_UPDATE_NOTIFITION, 0);
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
  const user = await getUserBySocket(socket);
  const currentUserId = user.id;

  const roomId = await redis.getRoomByUserId(`user:${currentUserId}`, `joinRoom`);
  const isPushed = await redis.getAllFieldsFromHash(`room:${roomId}`, `isPushed`);

  if (isPushed) {
    console.log('button', roomId);
    await startCustomInterval(socket, roomId);
    await redis.setRoomByUserId(`room:${roomId}`, `isPushed`, false);
  }
};
export const startCustomInterval = async (socket, roomId) => {
  const intervals = [5000, 5000];
  let currentIndex = 0;
  const runInterval = async () => {
    console.log('작업 실행: ', currentIndex); // 원하는 작업 수행
    const room = await redis.getAllFieldsFromHash(`room:${roomId}`);
    // 다음 인터벌 설정
    currentIndex = (currentIndex + 1) % intervals.length;
    const nextState = intervals[currentIndex];
    phaseUpdateHandler(room, nextState);
    setTimeout(runInterval, nextState);
  };
  setTimeout(runInterval, intervals[currentIndex]);
};
