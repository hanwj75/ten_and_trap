import envFiles from '../constants/env.js';

export const dbConfig = {
  database: {
    USER_DB: {
      host: envFiles.DB1_HOST,
      name: envFiles.DB1_NAME,
      password: envFiles.DB1_PASSWORD,
      port: envFiles.DB1_PORT,
      user: envFiles.DB1_USER,
    },
    RECORD_DB: {
      host: envFiles.DB2_HOST,
      name: envFiles.DB2_NAME,
      password: envFiles.DB2_PASSWORD,
      port: envFiles.DB2_PORT,
      user: envFiles.DB2_USER,
    },
    CARD_DB: {
      host: envFiles.DB3_HOST,
      name: envFiles.DB3_NAME,
      password: envFiles.DB3_PASSWORD,
      port: envFiles.DB3_PORT,
      user: envFiles.DB3_USER,
    },
  },
};
