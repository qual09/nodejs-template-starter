const userRoutes = require('express').Router();
const bcrypt = require('bcrypt');
const executeQuery = require('../db/postgres').executeQuery;
const authenticateUser = require('../utils/auth').authenticateUser;

const userColumns = `
  user_id,
  password,
  first_name,
  last_name,
  email,
  photo_url,
  access,
  create_user,
  update_user
`;

const userColumnsResponse = `
  user_id as "userId",
  first_name as "firstName",
  last_name as "lastName",
  email,
  photo_url as "photoURL",
  access,
  create_date as "createDate",
  create_user as "createUser",
  update_date as "updateDate",
  update_user as "updateUser"
`;

// API: Get Users List
userRoutes.get('/', authenticateUser, async (req, res, next) => {
  try {
    const startIndex = (Number(req.query.page) - 1) * Number(req.query.limit) || 0;
    const endIndex = Number(req.query.limit) || 1000;
    const queryParams = [];
    const query = `
      SELECT ${userColumnsResponse}
      FROM users
      OFFSET ${startIndex}
      LIMIT ${endIndex}
    `;
    const queryResult = await executeQuery(query, queryParams);
    const usersList = queryResult.rows;
    res.status(200).json(usersList);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
    next(error);
  }
});

// API: Get User by ID
userRoutes.get('/:userId', authenticateUser, async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const queryParams = [userId];
    const query = `
      SELECT ${userColumnsResponse}
      FROM users
      WHERE user_id = $1
      LIMIT 10
    `;
    const queryResult = await executeQuery(query, queryParams);
    if (!queryResult || queryResult.rows.length !== 1) {
      // throw new Error('Nof found!');
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    const userSelected = queryResult.rows[0];
    res.status(200).json(userSelected);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
    next(error);
  }
});

function generateUID() {
  // Generate the UID from two parts,
  // to ensure the random number provide enough bits.
  let firstPart = String((Math.random() * 46656) | 0);
  let secondPart = String((Math.random() * 46656) | 0);
  firstPart = ('000' + firstPart).slice(-3);
  secondPart = ('000' + secondPart).slice(-3);
  return firstPart + secondPart;
}

async function getUserPassword(userId) {
  try {
    const queryParams = [userId];
    const query = `
      SELECT password
      FROM users
      WHERE user_id = $1
    `;
    const queryResult = await executeQuery(query, queryParams);
    // User not found
    if (!queryResult || queryResult.rows.length !== 1) {
      return null;
    }
    const userPassword = queryResult.rows[0].password;
    return userPassword;
  } catch (error) {
    throw error;
  }
}

// ### Module exports
module.exports = {
  userRoutes: userRoutes,
  getUserPassword: getUserPassword
};