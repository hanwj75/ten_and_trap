export const throwAwayMyCard = async (userData) => {
  try {
    const user = userData;

    const randomIndex = Math.floor(Math.random() * user.handCardsCount);
    user.handCards[randomIndex].count--;
    if (user.handCards[randomIndex].count <= 0) {
      user.handCards.splice(randomIndex, 1);
    }
    user.handCardsCount--;

    return user;
  } catch (err) {
    console.error(`내 카드 버리기 에러`, err);
  }
};
