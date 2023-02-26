import { Router, Request, Response, NextFunction } from 'express';
import { QueryResult } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { executeQery } from '../db/query';
import { authenticateApp } from '../utils/auth';

export const authRoutes = Router();

// Grant new token or refresh current
authRoutes.post('/', authenticateApp, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const grantType: string = req.body.grant_type;
    if (!grantType) {
      // Unauthorized
      res.status(401).json({ error: 'Unauthorized' });
    } else if (grantType === 'password') {
      // Login
      const userId: string = req.body.username;
      const password: string = req.body.password;
      if (!userId || !password) {
        res.status(401).json({ error: 'Unauthorized' });
      } else {
        const userAuth: any = await login(userId, password);
        if (!userAuth) {
          res.status(401).json({ error: 'The username or password is invalid' });
        } else {
          res.status(200).json(userAuth);
        }
      }
    } else if (grantType === 'refresh_token') {
      // Refresh Token
      const refreshToken: string = req.body.refresh_token;
      if (!refreshToken) {
        res.status(401).json({ error: 'Unauthorized' });
      } else {
        const newTokens: any = await generateNewTokens(refreshToken);
        if (newTokens) {
          res.status(201).json(newTokens);
        } else {
          res.status(401).json({ error: 'Unauthorized' });
        }
      }
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  } catch (e: any) {
    res.sendStatus(500);
    next(e);
  }
});

// Logout and delete Tokens
authRoutes.delete('/logout', authenticateApp, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken: string = req.body.refresh_token;
    if (!refreshToken) {
      res.status(400).json({ error: 'Required fields are missing' });
    } else {
      await deleteRefreshToken(refreshToken);
      res.sendStatus(204);
    }
  } catch (e: any) {
    res.sendStatus(500);
    next(e);
  }
});

async function login(userId: string, password: string) {
  try {
    // Validate Password
    const hashPassword = await getUserPassword(userId);
    if (!hashPassword) return null;
    const validPassword = await bcrypt.compare(password, hashPassword);
    if (!validPassword) return null;

    // Delete all previous refreshTokens 
    await deleteUserRefreshTokens(userId);

    // Generate new Tokens
    const user: { userId: string } = { userId: userId };
    const accessToken: string = generateAccessToken(user);
    const refreshToken: string = generateRefreshToken(user);

    return { access_token: accessToken, refresh_token: refreshToken };
  } catch (e: any) {
    throw e;
  }
}

async function generateNewTokens(refreshToken: string) {
  try {
    const token: { userId: string, refreshToken: string } = await getRefreshToken(refreshToken);
    if (!token || !token.userId || !token.refreshToken) {
      return null;
    } else {
      const newTokens: any = jwt.verify(
        token.refreshToken,
        process.env.REFRESH_TOKEN_SECRET || '',
        (err: any, data: any) => {
          if (err) return null;
          const user: { userId: string } = { userId: token.userId };
          const newAccessToken: string = generateAccessToken(user);
          const newRefreshToken: string = generateRefreshToken(user);
          // Delete Previous Token (delay for current requests to finish)
          setTimeout(() => {
            deleteRefreshToken(refreshToken);
          }, 10000);
          return { access_token: newAccessToken, refresh_token: newRefreshToken };
        }
      );
      return newTokens;
    }
  } catch (e: any) {
    throw e;
  }
}

function generateAccessToken(user: { userId: string }) {
  const refreshToken: string = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET || '', { expiresIn: '8h' });
  return refreshToken;
}

function generateRefreshToken(user: { userId: string }) {
  const refreshToken: string = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET || '', { expiresIn: '24h' });
  createRefreshToken(refreshToken, user.userId);
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
    const response: QueryResult = await executeQery(query, queryParams);
    const userPassword: string | null = response.rows[0]['password'];
    return userPassword;
  } catch (e: any) {
    throw e;
  }
}

async function getRefreshToken(refreshToken: string) {
  try {
    const queryParams: string[] = [refreshToken];
    const query: string = `
			SELECT 
				user_id as "userId",
				refresh_token as "refreshToken"
			FROM tokens  
			WHERE refresh_token = $1
    `;
    const response: QueryResult = await executeQery(query, queryParams);
    return response.rowCount ? response.rows[0] : null;
  } catch (e: any) {
    throw e;
  }
}

async function createRefreshToken(refreshToken: string, userId: string) {
  try {
    const queryParams: string[] = [refreshToken, userId];
    const query: string = `
			INSERT INTO tokens (refresh_token, user_id) 
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      RETURNING 
        user_id as "userId", 
        refresh_token as "refreshToken"
    `;
    const response: QueryResult = await executeQery(query, queryParams);
    const responseToken: string | null = response.rows[0];
    return responseToken;
  } catch (e: any) {
    throw e;
  }
}

async function deleteUserRefreshTokens(userId: string) {
  try {
    const queryParams: string[] = [userId];
    const query: string = `
			DELETE FROM tokens  
      WHERE 
        user_id = $1
      RETURNING 
        user_id as "userId", 
        refresh_token as "refreshToken"
    `;
    const response: QueryResult = await executeQery(query, queryParams);
    const result: any[] = response.rows;
    return result;
  } catch (e: any) {
    throw e;
  }
}

async function deleteRefreshToken(refreshToken: string) {
  try {
    const queryParams: string[] = [refreshToken];
    const query: string = `
			DELETE FROM tokens  
			WHERE 
        refresh_token = $1
			RETURNING 
        user_id as "userId", 
        refresh_token as "refreshToken"
    `;
    const response: QueryResult = await executeQery(query, queryParams);
    const result: any[] = response.rows;
    return result;
  } catch (e: any) {
    throw e;
  }
}
