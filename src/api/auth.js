const authRoutes = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authenticateApp = require('../utils/auth').authenticateApp;
const getUserPassword = require('./user').getUserPassword;
const updateUserLoginDate = require('./user').updateUserLoginDate;

const ERRORS = {
  UNAUTHORIZED: 'Unauthorized',
  MISSING_CREDENTIALS: 'Username or password is missing',
  INVALID_CREDENTIALS: 'Invalid username or password',
  MISSING_REFRESH_TOKEN: 'Refresh token is missing',
  INVALID_REFRESH_TOKEN: 'Invalid refresh token',
  INTERNAL_SERVER_ERROR: 'Internal server error',
};

// ### API: Login / Refresh Access: Grant new token or refresh current
authRoutes.post('/', authenticateApp, async (req, res, next) => {
  try {
    const grantType = req.body.grant_type;
    if (!grantType) {
      // Unauthorized
      res.status(401).json({ error: ERRORS.UNAUTHORIZED });
    } else if (grantType === 'password') {
      // Login
      const userId = req.body.username;
      const password = req.body.password;
      if (!userId || !password) {
        res.status(401).json({ error: ERRORS.UNAUTHORIZE.MISSING_CREDENTIALS });
      } else {
        const userAuth = await login(userId, password);
        if (!userAuth) {
          res.status(401).json({ error: ERRORS.INVALID_CREDENTIALS });
        } else {
          res.status(200).json(userAuth);
        }
      }
    } else if (grantType === 'refresh_token') {
      // Refresh Token
      const refreshToken = req.body.refresh_token;
      if (!refreshToken) {
        res.status(401).json({ error: ERRORS.MISSING_REFRESH_TOKEN });
      } else {
        const newTokens = await generateNewTokens(refreshToken);
        if (newTokens) {
          res.status(201).json(newTokens);
        } else {
          res.status(401).json({ error: ERRORS.INVALID_REFRESH_TOKEN });
        }
      }
    } else {
      res.status(401).json({ error: ERRORS.UNAUTHORIZED });
    }
  } catch (error) {
    res.status(500).json({ error: error.message || ERRORS.INTERNAL_SERVER_ERROR });
    next(error);
  }
});

// ### API: Logout
authRoutes.delete('/logout', authenticateApp, async (req, res) => {
  res.sendStatus(204);
});

async function login(userId, password) {
  // Validate Password
  const userPassword = await getUserPassword(userId);
  if (!userPassword) return null;
  const match = await bcrypt.compare(password, userPassword);
  if (match) {
    // Update Login Date
    const loginDate = await updateUserLoginDate(userId);
    if (!loginDate) return null;
    // Generate new Tokens
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);
    return { access_token: accessToken, refresh_token: refreshToken };
  }
  return null;
}

async function generateNewTokens(refreshToken) {
  const newTokens = jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET || '',
    (err, data) => {
      if (err) return null;
      // Generate new Tokens
      const newAccessToken = generateAccessToken(data.userId);
      const newRefreshToken = generateRefreshToken(data.userId);
      return { access_token: newAccessToken, refresh_token: newRefreshToken };
    }
  );
  return newTokens;
}

function generateAccessToken(userId) {
  return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET || '', { expiresIn: '30m' });
}

function generateRefreshToken(userId) {
  return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET || '', { expiresIn: '8h' });
}

// ### Module exports
module.exports = authRoutes;