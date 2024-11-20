import { getUserBySocket, removeUser } from '../sessions/user.session.js';
import { redis } from '../init/redis/redis.js';

export const onEnd = (socket) => async () => {
  console.log('클라이언트 연결이 종료되었습니다.');

  const user = await getUserBySocket(socket);
  if (user) {
    // 방에 들어가 있다면 방에서 나가게
    // 만약 호스트라면 그 다음 사람에게 호스트를 넘겨주게
    // 일단 생각으로는 shift를 통해 맨 앞에 사람을 빼주는 식으로 할까 고민중
    // 앞에서부터 호스트와 먼저 들어온 사람 순
    redis.delRedisByKey(user.userId);
    await removeUser(socket);
  }
};
