import { Pool, types } from 'pg';
import dotenv from 'dotenv';

// ### Init Env Variables
dotenv.config();

// ### Init DB
const pool: Pool = new Pool({
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

export async function executeQery(query: string, queryParams: (string | number | boolean | null)[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(query, queryParams);
    return result;
  } catch (error) {
    throw error;
  } finally {
    // Make sure to release the client before any error handling,
    // just in case the error handling itself throws an error.
    client.release();
  }
}
