import { getGameAssets } from '../../../init/assets.js';

/**
 * @dest 드로우 3 카드 사용
 * @author 박건순
 *
 */

export const drawThreeCard = async (userData) => {
  try {
    const { card } = getGameAssets();
    // console.log(card.data[0].id);

    const user = userData;

    for (let i = 0; i < 3; i++) {
      const randomType = Math.floor(Math.random() * 7) + 1;
      const existType = user.handCards.find((card) => card.type === randomType);

      if (existType) {
        existType.count++;
      } else {
        user.handCards.push({ type: randomType, count: 1 });
      }
      user.handCardsCount++;
    }
    return user;
  } catch (err) {
    console.error(`드로우 에러`, err);
  }
};
