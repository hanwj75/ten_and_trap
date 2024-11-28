export const setCharacterType = (userNum) => {
  try {
    if (userNum > 7 || userNum < 2) {
      throw new Error('userNum must be between 2 and 7');
    }

    const CharacterTypes = [1, 2, 3, 4, 5, 6, 7];
    const result = [];

    while (result.length < userNum) {
      const randomIndex = Math.floor(Math.random() * CharacterTypes.length);
      result.push(CharacterTypes[randomIndex]);
      CharacterTypes.splice(randomIndex, 1);
    }

    return result;
  } catch (error) {
    console.error(error);
  }
};
