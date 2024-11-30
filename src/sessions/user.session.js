import CustomError from '../utils/error/customError.js';
import { ErrorCodes } from '../utils/error/errorCodes.js';
import { handleError } from '../utils/error/errorHandler.js';
import { userSessions } from './sessions.js';

export const addUser = async (user) => {
  userSessions.push(user);
  return user;
};

export const getUserById = (id) => {
  try {
    if (!id) {
      throw new CustomError(ErrorCodes.INVALID_REQUEST, `사용자 ID가 제공되지 않았습니다.`);
    }
    const user = userSessions.find((user) => user.id === id);
    if (!user) {
      throw new CustomError(ErrorCodes.UNKNOWN_ERROR, `사용자를 찾을 수 없습니다.`);
    }
    return user;
  } catch (err) {
    console.error(`아이디를 찾을 수 없습니다.`, err);
    handleError(null, err);
  }
};
export const modifyUserData = (userId, updatedData) => {
  try {
    const userIndex = userSessions.findIndex((user) => user.id === userId);

    if (userIndex !== -1) {
      userSessions[userIndex] = { ...userSessions[userIndex], ...updatedData };
      return userSessions[userIndex];
    } else {
      return null;
    }
  } catch (err) {
    console.error('User not found');
  }
};

export const removeUser = async (socket) => {
  try {
    const index = userSessions.findIndex((user) => user.socket === socket);
    if (index === -1) {
      throw new CustomError(ErrorCodes.UNKNOWN_ERROR, `사용자를 찾을 수 없습니다.`);
    }
    return userSessions.splice(index, 1)[0];
  } catch (err) {
    console.error(`유저 삭제 에러`, err);
    handleError(socket, err);
  }
};

export const getUserBySocket = async (socket) => {
  try {
    const user = userSessions.find((user) => user.socket === socket);
    if (!user) {
      throw new CustomError(ErrorCodes.UNKNOWN_ERROR, `사용자를 찾을 수 없습니다.`);
    }
    return user;
  } catch (err) {
    handleError(socket, err);
  }
};

export const getAllUser = async () => {
  try {
    if (!userSessions || userSessions.length === 0) {
      throw new CustomError(ErrorCodes.UNKNOWN_ERROR, `사용자를 찾을 수 없습니다.`);
    }
    return userSessions;
  } catch (err) {
    console.error(`전체 유저 조회 에러`, err);
    handleError(null, err);
  }
};

export const findUser = async (nickName) => {
  const foundUser = userSessions.find((a) => a.nickName === nickName);
  return foundUser;
};

export const findUsersByJoinRoom = async (roomId) => {
  const foundUsers = userSessions.filter((a) => a.joinRoom == roomId);
  return foundUsers;
};
