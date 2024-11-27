import { getGameAssets } from '../../../init/assets.js';
import { CardType, GlobalFailCode } from '../../../init/loadProto.js';
import { redis } from '../../../init/redis/redis.js';
import { getUserById, modifyUserData } from '../../../sessions/user.session.js';
export const drawThreeCard = async (userData) => {
  const { card } = getGameAssets();
  console.log(card.data[0].id);

  const user = userData;

  for (let i = 0; i < 3; i++) {
    const randomType = Math.floor(Math.random() * 23) + 1;
    const existType = user.handCards.find((card) => card.type === randomType);

    if (existType) {
      existType.count++;
    } else {
      user.handCards.push({ type: randomType, count: 1 });
    }
    user.handCardsCount++;
  }
  return user;
};
