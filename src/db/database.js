import mysql from 'mysql2/promise';
import { dbConfig } from '../config/dbconfig.js';
import { formatDate } from '../utils/dateFomatter.js';

const database = dbConfig.database;

// 데이터베이스 커넥션 풀 생성 함수
const createPool = (dbConfig) => {
  const pool = mysql.createPool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.name,
    waitForConnections: true,
    connectionLimit: 10, // 커넥션 풀에서 최대 연결 수
    queueLimit: 0, // 0일 경우 무제한 대기열
  });

  const originalQuery = pool.query;

  pool.query = (sql, params) => {
    const date = new Date();
    // 쿼리 실행시 로그
    console.log(`[${formatDate(date)}] Executing query: ${sql} ${params ? `, ${JSON.stringify(params)}` : ``}`);
    return originalQuery.call(pool, sql, params);
  };

  return pool;
};

// 여러 데이터베이스 커넥션 풀 생성
const pools = {
  USER_DB: createPool(database.USER_DB),
  RECORD_DB: createPool(database.RECORD_DB),
  // CARD_DB: createPool(database.CARD_DB),
};

export default pools;
