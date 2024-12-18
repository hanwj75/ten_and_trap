import CustomError from '../utils/error/customError.js';
import { ErrorCodes } from '../utils/error/errorCodes.js';
import { handleError } from '../utils/error/errorHandler.js';
import { gameSessions } from './sessions.js';

export const addGame = async (game) => {
  gameSessions.push(game);
  return game;
};

export const getGameById = (roomId) => {
  try {
    if (!roomId) {
      throw new CustomError(ErrorCodes.INVALID_REQUEST, `방 ID가 제공되지 않았습니다.`);
    }
    const game = gameSessions.find((game) => game.roomId === roomId);
    if (!game) {
      throw new CustomError(ErrorCodes.UNKNOWN_ERROR, `방을 찾을 수 없습니다.`);
    }
    return game;
  } catch (err) {
    handleError(null, err);
  }
};

export const modifyGameData = (roomId, updatedData) => {
  try {
    const gameIndex = gameSessions.findIndex((game) => game.roomId === roomId);

    if (gameIndex !== -1) {
      gameSessions[gameIndex] = { ...gameSessions[gameIndex], ...updatedData };
      return gameSessions[gameIndex];
    } else {
      return null;
    }
  } catch (err) {
    handleError(null, err);
  }
};

export const removeGame = async (roomId) => {
  try {
    const index = gameSessions.findIndex((game) => game.roomId === roomId);
    if (index === -1) {
      throw new CustomError(ErrorCodes.UNKNOWN_ERROR, `방을 찾을 수 없습니다.`);
    }
    return gameSessions.splice(index, 1)[0];
  } catch (err) {
    handleError(null, err);
  }
};
