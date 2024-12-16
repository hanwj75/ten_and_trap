import { handleError } from '../../../utils/error/errorHandler.js';

/**
 * @dest 버리기 카드 사용
 * @author 박건순
 *
 */

export const throwAwayMyCard = async (userData) => {
  try {
    const user = userData;

    const randomIndex = Math.floor(Math.random() * user.handCardsCount);
    const userHandCard = user.handCards[randomIndex];

    //카드 개수 감소
    if (userHandCard && userHandCard.count > 0) {
      userHandCard.count--;
    }

    //카드 개수가 0 이하일 경우 카드 제거
    if (userHandCard.count === 0) {
      user.handCards.splice(randomIndex, 1);
    }

    // handCardsCount를 업데이트
    user.handCardsCount = user.handCards.length;

    return user;
  } catch (err) {
    handleError(null, err);
  }
};
