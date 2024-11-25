import { RANDOM_POSITIONS } from '../constants/characterPositions.js';

export const setSpawnPoints = (userNum) => {
  const shuffled = [...RANDOM_POSITIONS];

  for (let i = shuffled.length - 1; i >= 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }

  return shuffled.slice(0, userNum);
};
