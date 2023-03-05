const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

function authenticateApp(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const base64Credentials = authHeader.split(' ')[1];
  // Check for Basic auth header
  if (!authHeader || authHeader.indexOf('Basic ') === -1 || !base64Credentials) {
    // Missing Authorization Header or Credentials
    return res.status(401).json({ error: 'Unauthorized. Error code: MCATH401' });
  }
  // Verify Credentials
  const credentials = Buffer.from(
    base64Credentials, 'base64'
  ).toString('ascii');
  const [oauthClientId, oauthClientSecret] = credentials.split(':');
  if (
    oauthClientId !== process.env.OAUTH_CLIENT_ID ||
    oauthClientSecret !== process.env.OAUTH_CLIENT_SECRET
  ) {
    // Invalid Authentication Credentials
    return res.status(401).json({ error: 'Unauthorized. Error code: ICAT401' });
  }
  next();
}

function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1];
  // Check for Bearer auth header
  if (!authHeader || authHeader.indexOf('Bearer ') === -1 || !token) {
    // Missing Authorization Header or Token
    return res.status(401).json({ error: 'Unauthorized. Error code: MCUTH401' });
  }
  // Verify Access 
  jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET || '',
    (err, data) => {
      // Below message must match on front end App's http interceptor
      if (err) return res.status(401).json({ error: 'invalid_token' });
      // Set currentUserId in a request parameter
      req.params.currentUserId = data.userId;
      next();
    }
  );
}

// ### Module exports
module.exports = {
  authenticateApp,
  authenticateUser
};