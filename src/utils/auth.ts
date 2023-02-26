import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const authHeader: string = req.headers.authorization || '';
  const token: string = authHeader.split(' ')[1];
  // Check for Bearer auth header
  if (!authHeader || authHeader.indexOf('Bearer ') === -1 || !token) {
    // Missing Authorization Header or Token
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  // Verify Access Token
  jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET || '',
    (err: any, data: any) => {
      if (err) return res.status(401).json({ error: 'Invalid Token.' });
      // Set currentUserId in a req parameter
      req.params.currentUserId = data.userId; 
      next();
    }
  );
}

export function authenticateApp(req: Request, res: Response, next: NextFunction) {
  const authHeader: string = req.headers.authorization || '';
  const base64Credentials: string = authHeader.split(' ')[1];
  // Check for Basic auth header
  if (!authHeader || authHeader.indexOf('Basic ') === -1 || !base64Credentials) {
    // Missing Authorization Header or Credentials
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  // Verify Credentials
  const credentials: string = Buffer.from(
    base64Credentials, 'base64'
  ).toString('ascii');
  const [oauthClientId, oauthClientSecret]: string[] = credentials.split(':');
  if (
    oauthClientId !== process.env.OAUTH_CLIENT_ID ||
    oauthClientSecret !== process.env.OAUTH_CLIENT_SECRET
  ) {
    // Invalid Authentication Credentials
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  next();
}
