import { roomSessions } from './sessions.js';

// 방 추가
export const addRoom = async (room) => {
  roomSessions.push(room);
  return room;
};

export const getRoomByRoomId = (roomId) => {
  return roomSessions.find((room) => room.id === roomId);
};

export const removeRoom = async (roomId) => {
  const index = roomSessions.findIndex((room) => room.id === roomId);
  if (index !== -1) {
    return roomSessions.splice(index, 1)[0];
  }
};

export const getAllRoom = () => {
  return roomSessions;
};
