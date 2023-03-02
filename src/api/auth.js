const authRoutes = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authenticateApp = require('../utils/auth').authenticateApp;
const getUserPassword = require('./user').getUserPassword;

// Login / Refresh Access: Grant new token or refresh current
authRoutes.post('/', authenticateApp, async (req, res, next) => {
  try {
    const grantType = req.body.grant_type;
    if (!grantType) {
      // Unauthorized
      res.status(401).json({ error: 'Unauthorized. Error code: MCGT401' });
    } else if (grantType === 'password') {
      // Login
      const userId = req.body.username;
      const password = req.body.password;
      if (!userId || !password) {
        res.status(401).json({ error: 'Unauthorized. Error code: MCUP401' });
      } else {
        const userAuth = await login(userId, password);
        if (!userAuth) {
          res.status(401).json({ error: 'Unauthorized. Error code: ICUP401' });
        } else {
          res.status(200).json(userAuth);
        }
      }
    } else if (grantType === 'refresh_token') {
      // Refresh Token
      const refreshToken = req.body.refresh_token;
      if (!refreshToken) {
        res.status(401).json({ error: 'Unauthorized. Error code: MCRT401' });
      } else {
        const newTokens = await generateNewTokens(refreshToken);
        if (newTokens) {
          res.status(201).json(newTokens);
        } else {
          res.status(401).json({ error: 'Unauthorized. Error code: ISENT401' });
        }
      }
    } else {
      res.status(401).json({ error: 'Unauthorized. Error code: ICGT401' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
    next(error);
  }
});

// Logout
authRoutes.delete('/logout', authenticateApp, async (req, res) => {
  res.sendStatus(204);
});

async function login(userId, password) {
  try {
    // Validate Password
    const hashPassword = await getUserPassword(userId);
    if (!hashPassword) return null;
    const validPassword = await bcrypt.compare(password, hashPassword);
    if (!validPassword) return null;

    // Generate new Tokens
    const newToken = { userId: userId };
    const accessToken = generateAccessToken(newToken);
    const refreshToken = generateRefreshToken(newToken);

    return { access_token: accessToken, refresh_token: refreshToken };
  } catch (error) {
    throw error;
  }
}

async function generateNewTokens(refreshToken) {
  try {
    const newTokens = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET || '',
      (err, data) => {
        if (err) return null;
        // Generate new Tokens
        const newToken = { userId: data.userId };
        const newAccessToken = generateAccessToken(newToken);
        const newRefreshToken = generateRefreshToken(newToken);
        return { access_token: newAccessToken, refresh_token: newRefreshToken };
      }
    );
    return newTokens;
  } catch (error) {
    throw error;
  }
}

function generateAccessToken(newToken) {
  const refreshToken = jwt.sign(
    newToken,
    process.env.ACCESS_TOKEN_SECRET || '',
    { expiresIn: '1h' }
  );
  return refreshToken;
}

function generateRefreshToken(newToken) {
  const refreshToken = jwt.sign(
    newToken,
    process.env.REFRESH_TOKEN_SECRET || '',
    { expiresIn: '8h' }
  );
  return refreshToken;
}

// ### Module exports
module.exports = authRoutes;