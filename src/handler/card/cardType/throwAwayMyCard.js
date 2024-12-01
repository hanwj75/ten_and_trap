import CustomError from '../../../utils/error/customError.js';
import { ErrorCodes } from '../../../utils/error/errorCodes.js';
import { handleError } from '../../../utils/error/errorHandler.js';

export const throwAwayMyCard = async (userData) => {
  try {
    const user = userData;

    //handCards 정의되어 있는지 확인
    if (!user.handCards || !Array.isArray(user.handCards)) {
      throw new CustomError(ErrorCodes.INVALID_REQUEST, `유효하지 않은 카드 데이터`);
    }
    // handCardsCount가 실제 handCards 배열의 길이와 일치하도록 설정
    user.handCardsCount = user.handCards.length;

    // 카드가 없을 경우 처리
    if (user.handCardsCount === 0) {
      throw new CustomError(ErrorCodes.CHARACTER_NO_CARD, `버릴 카드가 없습니다.`);
    }

    const randomIndex = Math.floor(Math.random() * user.handCardsCount);
    const userHandCard = user.handCards[randomIndex];

    //카드 개수 감소
    if (userHandCard && userHandCard.count > 0) {
      userHandCard.count--;
    }

    //카드 개수가 0 이하일 경우 카드 제거
    if (userHandCard.count === 0) {
      user.handCards.splice(randomIndex, 1);
    } else {
      throw new CustomError(ErrorCodes.CHARACTER_STATE_ERROR, `카드 개수가 0 보다 작습니다.`);
    }

    // handCardsCount를 업데이트
    user.handCardsCount = user.handCards.length;

    return user;
  } catch (err) {
    handleError(null, err);
  }
};
