const testConnection = async (pool, dbName) => {
  try {
    const [rows] = await pool.query(`SELECT 1 + 1 AS solution`);
    // console.log(`${dbName} 테스트 쿼리 결과: ${rows[0].solution}`);
  } catch (err) {
    console.error(`${dbName} 테스트 쿼리 실행 오류:`, err);
  }
};

const testAllConnections = async (pools) => {
  await testConnection(pools.USER_DB, 'USER_DB');
  await testConnection(pools.RECORD_DB, 'RECORD_DB');
  // await testConnection(pools.CARD_DB, 'CARD_DB');
};
export default testAllConnections;
