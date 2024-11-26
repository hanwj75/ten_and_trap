import { RoleType } from '../init/loadProto.js';

export const setRole = (userNum, users) => {
  let roles = [];

  if (userNum === 4) {
    roles = [
      RoleType.values.TARGET,
      RoleType.values.HITMAN,
      RoleType.values.HITMAN,
      RoleType.values.PSYCHOPATH,
    ];
  }

  if (userNum === 5) {
    roles = [
      RoleType.values.TARGET,
      RoleType.values.BODYGUARD,
      RoleType.values.HITMAN,
      RoleType.values.HITMAN,
      RoleType.values.PSYCHOPATH,
    ];
  }

  if (userNum === 6) {
    roles = [
      RoleType.values.TARGET,
      RoleType.values.BODYGUARD,
      RoleType.values.HITMAN,
      RoleType.values.HITMAN,
      RoleType.values.HITMAN,
      RoleType.values.PSYCHOPATH,
    ];
  }

  if (userNum === 7) {
    roles = [
      RoleType.values.TARGET,
      RoleType.values.BODYGUARD,
      RoleType.values.BODYGUARD,
      RoleType.values.HITMAN,
      RoleType.values.HITMAN,
      RoleType.values.HITMAN,
      RoleType.values.PSYCHOPATH,
    ];
  }

  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }

  users.forEach((user, index) => {
    user.character.roleType = roles[index];
  });

  return users;
};
