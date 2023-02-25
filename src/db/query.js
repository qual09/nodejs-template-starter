"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeQery = void 0;
const connection_1 = require("./connection");
async function executeQery(query, queryParams) {
    const client = await connection_1.pool.connect();
    try {
        const result = await client.query(query, queryParams);
        return result;
    }
    catch (e) {
        throw e;
    }
    finally {
        // Make sure to release the client before any error handling,
        // just in case the error handling itself throws an error.
        client.release();
    }
}
exports.executeQery = executeQery;
