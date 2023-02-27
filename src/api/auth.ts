import { Router, Request, Response, NextFunction } from 'express';
import { QueryResult } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { executeQuery } from '../db/postgres';
import { authenticateApp } from '../utils/auth';

export const authRoutes = Router();

// Login / Refresh Access: Grant new token or refresh current
authRoutes.post('/', authenticateApp, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const grantType: string = req.body.grant_type;
    if (!grantType) {
      // Unauthorized
      res.status(401).json({ error: 'Unauthorized. Error code: MCGT401' });
    } else if (grantType === 'password') {
      // Login
      const userId: string = req.body.username;
      const password: string = req.body.password;
      if (!userId || !password) {
        res.status(401).json({ error: 'Unauthorized. Error code: MCUP401' });
      } else {
        const userAuth: any = await login(userId, password);
        if (!userAuth) {
          res.status(401).json({ error: 'Unauthorized. Error code: ICUP401' });
        } else {
          res.status(200).json(userAuth);
        }
      }
    } else if (grantType === 'refresh_token') {
      // Refresh Token
      const refreshToken: string = req.body.refresh_token;
      if (!refreshToken) {
        res.status(401).json({ error: 'Unauthorized. Error code: MCRT401' });
      } else {
        const newTokens: { access_token: string, refresh_token: string } | null = await generateNewTokens(refreshToken);
        if (newTokens) {
          res.status(201).json(newTokens);
        } else {
          res.status(401).json({ error: 'Unauthorized. Error code: ISENT401' });
        }
      }
    } else {
      res.status(401).json({ error: 'Unauthorized. Error code: ICGT401' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
    next(error);
  }
});

// Logout
authRoutes.delete('/logout', authenticateApp, async (req: Request, res: Response) => {
  res.sendStatus(204);
});

async function login(userId: string, password: string) {
  try {
    // Validate Password
    const hashPassword = await getUserPassword(userId);
    if (!hashPassword) return null;
    const validPassword = await bcrypt.compare(password, hashPassword);
    if (!validPassword) return null;

    // Generate new Tokens
    const newToken: { userId: string } = { userId: userId };
    const accessToken: string = generateAccessToken(newToken);
    const refreshToken: string = generateRefreshToken(newToken);

    return { access_token: accessToken, refresh_token: refreshToken };
  } catch (error: any) {
    throw error;
  }
}

async function generateNewTokens(refreshToken: string) {
  try {
    const newTokens: any = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET || '',
      (err: any, data: any) => {
        if (err) return null;
        // Generate new Tokens
        const newToken: { userId: string } = { userId: data.userId };
        const newAccessToken: string = generateAccessToken(newToken);
        const newRefreshToken: string = generateRefreshToken(newToken);
        return { access_token: newAccessToken, refresh_token: newRefreshToken };
      }
    );
    return newTokens;
  } catch (error: any) {
    throw error;
  }
}

function generateAccessToken(newToken: { userId: string }) {
  const refreshToken: string = jwt.sign(
    newToken,
    process.env.ACCESS_TOKEN_SECRET || '',
    { expiresIn: '1h' }
  );
  return refreshToken;
}

function generateRefreshToken(newToken: { userId: string }) {
  const refreshToken: string = jwt.sign(
    newToken,
    process.env.REFRESH_TOKEN_SECRET || '',
    { expiresIn: '8h' }
  );
  return refreshToken;
}

async function getUserPassword(userId: string) {
  try {
    const queryParams: string[] = [userId];
    const query: string = `
      SELECT password
      FROM users
      WHERE user_id = $1
    `;
    const queryResult: QueryResult = await executeQuery(query, queryParams);
    // User not found
    if (!queryResult || queryResult.rows.length !== 1) {
      return null;
    }
    const userPassword: string = queryResult.rows[0].password;
    return userPassword;
  } catch (error: any) {
    throw error;
  }
}
