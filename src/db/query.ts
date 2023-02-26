import { pool } from './connection';

export async function executeQery(query: string, queryParams: (string | number | boolean | null)[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(query, queryParams);
    return result;
  } catch (e) {
    throw e;
  } finally {
    // Make sure to release the client before any error handling,
    // just in case the error handling itself throws an error.
    client.release();
  }
}
