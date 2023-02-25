"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
// ### Init Env Variables
dotenv_1.default.config();
// ### Init DB
exports.pool = new pg_1.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT)
});
// the pool will emit an error on behalf of any idle clients
// it contains if a backend error or network partition happens
exports.pool.on('error', (err, client) => {
    console.error('Unexpected Error:', err);
    process.exit(-1);
});
// ### Override date parser
pg_1.types.setTypeParser(1114, stringValue => stringValue); // time without timezone 
pg_1.types.setTypeParser(1082, stringValue => stringValue); // date 
