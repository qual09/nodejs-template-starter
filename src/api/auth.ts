import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticateApp } from '../utils/auth';
import { getUserPassword } from './user';

export const authRoutes = Router();

const ERRORS = {
  UNAUTHORIZED: 'Unauthorized',
  MISSING_CREDENTIALS: 'Username or password is missing',
  INVALID_CREDENTIALS: 'Invalid username or password',
  MISSING_REFRESH_TOKEN: 'Refresh token is missing',
  INVALID_REFRESH_TOKEN: 'Invalid refresh token',
  INTERNAL_SERVER_ERROR: 'Internal server error',
};

// ### API: Login / Refresh Access: Grant new token or refresh current
authRoutes.post('/', authenticateApp, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const grantType: string = req.body.grant_type;
    if (!grantType) {
      // Unauthorized
      res.status(401).json({ error: ERRORS.UNAUTHORIZED });
    } else if (grantType === 'password') {
      // Login
      const userId: string = req.body.username;
      const password: string = req.body.password;
      if (!userId || !password) {
        res.status(401).json({ error: ERRORS.MISSING_CREDENTIALS });
      } else {
        const userAuth: any = await login(userId, password);
        if (!userAuth) {
          res.status(401).json({ error: ERRORS.INVALID_CREDENTIALS });
        } else {
          res.status(200).json(userAuth);
        }
      }
    } else if (grantType === 'refresh_token') {
      // Refresh Token
      const refreshToken: string = req.body.refresh_token;
      if (!refreshToken) {
        res.status(401).json({ error: ERRORS.MISSING_REFRESH_TOKEN });
      } else {
        const newTokens: { access_token: string, refresh_token: string } | null = await generateNewTokens(refreshToken);
        if (newTokens) {
          res.status(201).json(newTokens);
        } else {
          res.status(401).json({ error: ERRORS.INVALID_REFRESH_TOKEN });
        }
      }
    } else {
      res.status(401).json({ error: ERRORS.UNAUTHORIZED });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || ERRORS.INTERNAL_SERVER_ERROR });
    next(error);
  }
});

// ### API: Logout
authRoutes.delete('/logout', authenticateApp, async (req: Request, res: Response) => {
  res.sendStatus(204);
});

async function login(userId: string, password: string) {
  try {
    // Validate Password
    const userPassword = await getUserPassword(userId);
    if (!userPassword) return null;
    const match = await bcrypt.compare(password, userPassword);
    if (match) {
      // Generate new Tokens
      const accessToken = generateAccessToken(userId);
      const refreshToken = generateRefreshToken(userId);
      return { access_token: accessToken, refresh_token: refreshToken };
    }
    return null;
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
        const newAccessToken: string = generateAccessToken(data.userId);
        const newRefreshToken: string = generateRefreshToken(data.userId);
        return { access_token: newAccessToken, refresh_token: newRefreshToken };
      }
    );
    return newTokens;
  } catch (error: any) {
    throw error;
  }
}

function generateAccessToken(userId: string) {
  return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET || '', { expiresIn: '30m' });
}

function generateRefreshToken(userId: string) {
  return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET || '', { expiresIn: '8h' });
}
