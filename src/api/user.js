"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = require("express");
const query_1 = require("../db/query");
exports.userRoutes = (0, express_1.Router)();
// Get Users List
exports.userRoutes.get('/', async (req, res, next) => {
    try {
        const query = `SELECT * FROM users`;
        const queryParams = [];
        const response = await (0, query_1.executeQery)(query, queryParams);
        res.status(200).json(response.rows);
    }
    catch (e) {
        res.status(500).json({ error: "Internal server error" });
        next(e);
    }
});
// Get User by ID
exports.userRoutes.get('/:userId', async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const query = `
      SELECT * 
      FROM users
      WHERE user_id = $1
    `;
        const queryParams = [userId];
        const response = await (0, query_1.executeQery)(query, queryParams);
        if (!response || !response.rows[0]) {
            // throw new Error('Nof found!');
            res.status(404).json({ error: "User not found." });
            return;
        }
        res.status(200).json(response);
    }
    catch (e) {
        res.status(500).json({ error: "Internal server error" });
        next(e);
    }
});
