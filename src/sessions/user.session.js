import { userSessions } from './sessions.js';

export const addUser = async (user) => {
  userSessions.push(user);
  return user;
};

export const getUserById = (Id) => {
  return userSessions.find((user) => user.id === Id);
};

export const modifyUserData = (userId, updatedData) => {
  const userIndex = userSessions.findIndex((user) => user.id === userId);

  if (userIndex !== -1) {
    userSessions[userIndex] = { ...userSessions[userIndex], ...updatedData };
    return userSessions[userIndex];
  } else {
    console.log('User not found');
    return null;
  }
};

export const removeUser = async (socket) => {
  const index = userSessions.findIndex((user) => user.socket === socket);
  if (index !== -1) {
    return userSessions.splice(index, 1)[0];
  }
};

export const getUserBySocket = async (socket) => {
  const user = userSessions.find((user) => user.socket === socket);
  if (!user) {
    console.error('User not found');
  }
  return user;
};

export const getAllUser = async () => {
  return userSessions;
};

export const findUser = async (nickName) => {
  const foundUser = userSessions.find((a) => a.nickName === nickName);
  return foundUser;
};

export const findUsersByJoinRoom = async (roomId) => {
  const foundUsers = userSessions.filter((a) => a.joinRoom == roomId);
  return foundUsers;
};
