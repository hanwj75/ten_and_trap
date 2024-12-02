/**
 * @dest 버리기 카드 사용
 * @author 박건순
 *
 */

export const throwAwayMyCard = async (userData) => {
  const user = userData;

  const randomIndex = Math.floor(Math.random() * user.handCardsCount);
  user.handCards[randomIndex].count--;
  if (user.handCards[randomIndex].count <= 0) {
    user.handCards.splice(randomIndex, 1);
  }
  user.handCardsCount--;

  return user;
};
