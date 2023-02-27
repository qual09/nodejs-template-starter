const router = require('express').Router();
const executeQuery = require('../db/postgres').executeQuery;

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

// Get Users List
router.get('/', async (req, res, next) => {
  try {
    const queryParams = [];
    const query = `SELECT ${userColumnsResponse} FROM users`;
    const queryResult = await executeQuery(query, queryParams);
    const usersList = queryResult.rows;
    res.status(200).json(usersList);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
    next(error);
  }
});

// Get User by ID
router.get('/:userId', async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const queryParams = [userId];
    const query = `
      SELECT ${userColumnsResponse}
      FROM users
      WHERE user_id = $1
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

// ### Module exports
module.exports = router;