import dotenv from 'dotenv';

dotenv.config();

const envFiles = {
  server: {
    PORT: process.env.PORT || 3333,
    HOST: process.env.HOST || 'localhost',
    CLIENT_VERSION: process.env.CLIENT_VERSION || '1.0.0',
  },
  jwt: {
    // JWT KEY
    ACCESS_TOKEN_SECRET_KEY: process.env.ACCESS_TOKEN_SECRET_KEY,
  },
  client: {},
  database: {
    DB1_HOST: process.env.DB1_HOST || 'localhost',
    DB1_NAME: process.env.DB1_NAME || 'db_name',
    DB1_PASSWORD: process.env.DB1_PASSWORD || 'your_password',
    DB1_PORT: process.env.DB1_PORT || 3306,
    DB1_USER: process.env.DB1_USER || 'your_username',

    DB2_HOST: process.env.DB2_HOST || 'localhost',
    DB2_NAME: process.env.DB2_NAME || 'db_name',
    DB2_PASSWORD: process.env.DB2_PASSWORD || 'your_password',
    DB2_PORT: process.env.DB2_PORT || 3306,
    DB2_USER: process.env.DB2_USER || 'your_username',

    DB3_HOST: process.env.DB3_HOST || 'localhost',
    DB3_NAME: process.env.DB3_NAME || 'db_name',
    DB3_PASSWORD: process.env.DB3_PASSWORD || 'your_password',
    DB3_PORT: process.env.DB3_PORT || 3306,
    DB3_USER: process.env.DB3_USER || 'your_username',

    REDIS_PORT: process.env.REDIS_PORT || 6379,
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || 'your_password',
  },
  redis: {
    // REDIS
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: process.env.REDIS_PORT || 3306,
    REDIS_USERNAME: process.env.REDIS_USERNAME || 'your_username',
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || 'your_password',
  },
};

export default envFiles;
