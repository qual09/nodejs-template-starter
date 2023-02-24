const { Pool, types } = require('pg');
const dotenv = require('dotenv');

// ### Init Env Variables
dotenv.config();

// ### Init DB
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT)
});

// the pool will emit an error on behalf of any idle clients
// it contains if a backend error or network partition happens
pool.on('error', (err, client) => {
  console.error('Unexpected Error:', err);
  process.exit(-1);
});

// ### Override date parser
types.setTypeParser(1114, stringValue => stringValue); // time without timezone 
types.setTypeParser(1082, stringValue => stringValue); // date 

// ### Module exports
module.exports = pool;