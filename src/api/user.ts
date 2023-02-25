import { Router, Request, Response, NextFunction } from 'express';
import { executeQery } from '../db/query';
import { QueryResult } from 'pg';

export const userRoutes: Router = Router();

// Get Users List
userRoutes.get('/', async (req, res, next) => {
  try {
    const queryParams: string[] | number[] | null = [];
    const query: string = `SELECT * FROM users`;
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
    const userId: string = req.params.userId;
    const queryParams: string[] = [userId];
    const query: string = `
      SELECT * 
      FROM users
      WHERE user_id = $${queryParams.length}
    `;
    const response: QueryResult = await executeQery(query, queryParams);
    if (!response || !response.rows[0]) {
      // throw new Error('Nof found!');
      res.status(404).json({ error: "User not found." });
      return;
    }
    res.status(200).json(response.rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
    next(e);
  }
});
