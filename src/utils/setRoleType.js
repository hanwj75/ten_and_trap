import { RoleType } from '../init/loadProto.js';

export const setRoleType = (userNum) => {
  try {
    if (userNum > 7 || userNum < 2) {
      throw new Error('userNum must be between 2 and 7');
    }

    const roleDistribution = {
      2: { 1: 1, 3: 1 },
      3: { 1: 1, 3: 1, 4: 1 },
      4: { 1: 1, 3: 2, 4: 1 },
      5: { 1: 1, 2: 1, 3: 2, 4: 1 },
      6: { 1: 1, 2: 1, 3: 3, 4: 1 },
      7: { 1: 1, 2: 2, 3: 3, 4: 1 },
    };

    const roles = [];
    const distribution = roleDistribution[userNum];

    for (const [role, count] of Object.entries(distribution)) {
      for (let i = 0; i < count; i++) {
        roles.push(Number(role));
      }
    }

    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    return roles;
  } catch (error) {
    console.error(error);
  }
};
