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
