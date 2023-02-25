import { Router, Request, Response, NextFunction } from 'express';
import { executeQery } from '../db/query';
import { QueryResult } from 'pg';

export const userRoutes = Router();

// Get Users List
userRoutes.get('/', async (req, res, next) => {
  try {
    const query = `SELECT * FROM users`;
    const queryParams: string[] | number[] | null = [];
    const response: QueryResult = await executeQery(query, queryParams);
    res.status(200).json(response.rows);
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
    next(e);
  }
});

// Get User by ID
userRoutes.get('/:userId', async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const query = `
      SELECT * 
      FROM users
      WHERE user_id = $1
    `;
    const queryParams: string[] = [userId];
    const response: QueryResult = await executeQery(query, queryParams);
    if (!response || !response.rows[0]) {
      // throw new Error('Nof found!');
      res.status(404).json({ error: "User not found." });
      return;
    }
    res.status(200).json(response);
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
    next(e);
  }
});
