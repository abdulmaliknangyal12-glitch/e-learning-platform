const sql = require("mssql");

const config = {
  user: 'Abdul',
  password: 'malik',
  server: 'localhost',
  port: 1433,
  database: 'E_Learning',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};


const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('✅ Database connected');
    return pool;
  })
  .catch(err => {
    console.log('❌ Database connection failed', err);
  });

module.exports = {
  sql,
  poolPromise
};
