import dotenv from 'dotenv';

dotenv.config();

const envFiles = {
  server: {
    PORT: process.env.PORT || 3333,
    HOST: process.env.HOST || 'localhost',
    CLIENT_VERSION: process.env.CLIENT_VERSION || '1.0.0',
  },
  loginServer: {
    LOGIN_PORT: process.env.LOGIN_PORT || 3334,
    LOGIN_HOST: process.env.LOGIN_HOST || 'localhost',
    CLIENT_VERSION: process.env.CLIENT_VERSION || '1.0.0',
  },
  jwt: {
    // JWT KEY
    ACCESS_TOKEN_SECRET_KEY: process.env.ACCESS_TOKEN_SECRET_KEY,
  },
  client: {},
  database: {
    DB1_HOST: process.env.DB1_HOST || 'mysql',
    DB1_NAME: process.env.DB1_NAME || 'USER_DB',
    DB1_PASSWORD: process.env.DB1_PASSWORD || 'asdfg159',
    DB1_PORT: process.env.DB1_PORT || 3306,
    DB1_USER: process.env.DB1_USER || 'root',

    DB2_HOST: process.env.DB2_HOST || 'mysql',
    DB2_NAME: process.env.DB2_NAME || 'RECORD_DB',
    DB2_PASSWORD: process.env.DB2_PASSWORD || 'asdfg159',
    DB2_PORT: process.env.DB2_PORT || 3306,
    DB2_USER: process.env.DB2_USER || 'root',

    DB3_HOST: process.env.DB3_HOST || 'mysql',
    DB3_NAME: process.env.DB3_NAME || 'db_name',
    DB3_PASSWORD: process.env.DB3_PASSWORD || 'asdfg159',
    DB3_PORT: process.env.DB3_PORT || 3306,
    DB3_USER: process.env.DB3_USER || 'root',

    REDIS_PORT: process.env.REDIS_PORT || 6379,
    REDIS_HOST: process.env.REDIS_HOST || 'redis',
    // REDIS_PASSWORD: process.env.REDIS_PASSWORD || null,
  },
};

export default envFiles;
