// CREATE TABLE IF NOT EXISTS Record(
//    id INT(11) AUTO_INCREMENT PRIMARY KEY,
//    userId INT(11) NOT NULL,
//    ranking JSON NOT NULL,
//    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
//    FOREIGN KEY (userId) REFERENCES USER_DB.`User`(id)

import pools from '../database.js';
import { SQL_QUERIES } from '../sql.queries.js';

/**
 * @desc 게임 종료시 순위 저장 , 조회
 * @author 한우종
 * @todo 게임종료시 데이터 저장, 랭킹페이지를 보여주기위해 조회가 필요할듯? 추후추가
 */

export const createRecord = async (userId) => {
  const [result] = await pools.RECORD_DB.query(SQL_QUERIES.CREATE_RECORD, [userId, ranking]);
  return { id: result.insertId, userId, ranking };
};
