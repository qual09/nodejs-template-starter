const pool = require('./connection');

async function executeQery(query, queryParams) {
  const client = await pool.connect();
  try {
    const res = await client.query(query, queryParams);
    return res;
  } catch (e) {
    throw e;
  } finally {
    // Make sure to release the client before any error handling,
    // just in case the error handling itself throws an error.
    client.release();
  }
}

// ### Module exports
module.exports = {
  executeQery
};