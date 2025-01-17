import { toCamelCase } from '../../utils/transformCase.js';
import pools from '../database.js';
import { SQL_QUERIES } from '../sql.queries.js';

/**
 *
 * @desc 유저 조회 , 생성 , 수정
 * @author 한우종
 *
 */
export const findUserById = async (userId) => {
  const [rows] = await pools.USER_DB.query(SQL_QUERIES.FIND_USER_BY_ID, [userId]);
  return toCamelCase(rows[0]);
};

export const createUser = async (userId, nickName, password) => {
  const [rows] = await pools.USER_DB.query(SQL_QUERIES.CREATE_USER, [userId, nickName, password]);
  return toCamelCase(rows[0]);
};

export const updateUserData = async (userId, newPassword) => {
  //새로 생성한 비밀번호 해시화
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const [rows] = await pools.USER_DB.query(SQL_QUERIES.UPDATE_USER_DATA, [newPassword, userId]);
  return rows.affectedRows > 0;
};

export const updateUserLogin = async (userId) => {
  const [rows] = await pools.USER_DB.query(SQL_QUERIES.UPDATE_USER_LOGIN, [userId]);
  return toCamelCase(rows[0]);
};

export const addGold = async (userId) => {
  const gold = await pools.USER_DB.query(SQL_QUERIES.UPDATE_USER_GOLD, userId);
  return toCamelCase(gold);
};

export const addRankPoint = async (userId) => {
  const rankpoint = await pools.USER_DB.query(SQL_QUERIES.UPDATE_USER_RANKPOINT, userId);
  return toCamelCase(rankpoint);
};
