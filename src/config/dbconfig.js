import envFiles from '../constants/env.js';

const env = envFiles.database;
export const dbConfig = {
  database: {
    USER_DB: {
      host: env.DB1_HOST,
      port: env.DB1_PORT,
      user: env.DB1_USER,
      password: env.DB1_PASSWORD,
      name: env.DB1_NAME,
    },
    RECORD_DB: {
      host: env.DB2_HOST,
      port: env.DB2_PORT,
      user: env.DB2_USER,
      password: env.DB2_PASSWORD,
      name: env.DB2_NAME,
    },
    CARD_DB: {
      host: env.DB3_HOST,
      port: env.DB3_PORT,
      user: env.DB3_USER,
      password: env.DB3_PASSWORD,
      name: env.DB3_NAME,
    },
  },
};
