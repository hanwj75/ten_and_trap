export const SQL_QUERIES = {
  //user
  FIND_USER_BY_ID: 'SELECT * FROM User WHERE userId = ?',
  CREATE_USER: 'INSERT INTO User (userId,nickName, password) VALUES (?,?,?)',
  UPDATE_USER_DATA: 'UPDATE User SET password =? WHERE userId =?',
  UPDATE_USER_LOGIN: 'UPDATE User SET updatedAt = CURRENT_TIMESTAMP WHERE userId = ?',
  UPDATE_USER_GOLD: 'UPDATE User SET gold = gold+100 WHERE Id =?',
  UPDATE_USER_RANKPOINT: 'UPDATE User SET rankpoint = rankpoint+100 WHERE Id =?',

  //record
  CREATE_RECORD: 'INSERT INTO Record (userId, ranking) VALUES (?,?)',
};
