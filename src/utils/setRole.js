import { RoleType } from '../init/loadProto.js';

export const setRole = (users) => {
  //   const roles = [];
  //   const userNum = users.length;

  //   // 타겟 1 고정
  //   roles.push(RoleType.values.TARGET);

  //   // 2인 : 타겟1, 히트맨1
  //   if (userNum >= 2) {
  //     roles.push(RoleType.values.HITMAN);
  //   }

  //   // 3인 : 타겟1, 히트맨1, 싸이코패스1
  //   if (userNum >= 3) {
  //     roles.push(RoleType.values.PSYCHOPATH);
  //   }

  //   // 4인 : 타겟1, 히트맨2, 싸이코패스1
  //   if (userNum >= 4) {
  //     roles.push(RoleType.values.HITMAN);
  //   }

  //   // 5인 : 타겟1, 보디가드1, 히트맨2, 싸이코패스1
  //   if (userNum >= 5) {
  //     roles.push(RoleType.values.BODYGUARD);
  //   }

  //   // 6인 : 타겟1, 보디가드1, 히트맨3, 싸이코패스1
  //   if (userNum >= 6) {
  //     roles.push(RoleType.values.HITMAN);
  //   }

  //   // 7인 : 타겟1, 보디가드2, 히트맨3, 싸이코패스1
  //   if (userNum >= 7) {
  //     roles.push(RoleType.values.BODYGUARD);
  //   }

  //     for(let i = array.length-1; i>0)

  users[0].character.roleType = RoleType.values.TARGET;

  users[1].character.roleType = RoleType.values.HITMAN;

  return users;
};
