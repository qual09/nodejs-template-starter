const router = require('express').Router();
const dbQuery = require('../db/query');

// Get Users List
router.get('/', async (req, res, next) => {
  try {
    const query = `SELECT * FROM users`;
    const queryParams = [];
    const response = (await dbQuery.executeQery(query, queryParams)).rows;
    res.status(200).json(response);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error.' });
    next(e);
  }
});

// Get User by ID
router.get('/:userId', async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const query = `
      SELECT * 
      FROM users
      WHERE user_id = $1
    `;
    const queryParams = [userId];
    const response = (await dbQuery.executeQery(query, queryParams)).rows[0];
    if (!response) {
      // throw new Error('Nof found!');
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    res.status(200).json(response);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error.' });
    next(e);
  }
});

// ### Module exports
module.exports = router;