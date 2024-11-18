export const SQL_QUERIES = {
  //user
  FIND_USER_BY_ID: 'SELECT * FROM User WHERE userId = ?',
  CREATE_USER: 'INSERT INTO User (userId, password) VALUES (?, ?)',
  UPDATE_USER_DATA: 'UPDATE User SET password =? WHERE userId =?',

  //record
  CREATE_RECORD: 'INSERT INTO Record (userId, ranking) VALUES (?,?)',
};
