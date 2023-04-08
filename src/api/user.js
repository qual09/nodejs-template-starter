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

// API: Search Users by Email
userRoutes.get('/email/:email', authenticateUser, async (req, res, next) => {
  try {
    const email = req.params.email;
    const queryParams = [email];
    const query = `
      SELECT ${userColumnsResponse}
      FROM users
      WHERE email like '%' || $1 || '%'
      LIMIT 10
    `;
    const queryResult = await executeQuery(query, queryParams);
    if (!queryResult || queryResult.rows.length < 1) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    const usersSelected = queryResult.rows;
    res.status(200).json(usersSelected);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
    next(error);
  }
});

// API: Create New User
userRoutes.post('/', authenticateUser, async (req, res, next) => {
  try {
    const user = JSON.parse(JSON.stringify(req.body));
    if (!user || !user.password || !user.firstName) {
      throw new Error('Failed to create a new User. Invalid data received.');
    }
    if (!user.userId) {
      user.userId = generateUID();
    }
    user.createUser = req.params.currentUserId;
    user.updateUser = req.params.currentUserId;
    user.password = await bcrypt.hash(user.password, 10);
    const queryParams = [
      user.userId,
      user.password,
      user.firstName,
      user.lastName,
      user.email,
      user.photoURL,
      user.access,
      user.createUser,
      user.updateUser
    ];
    const query = `
      INSERT INTO users (${userColumns})
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT DO NOTHING
      RETURNING ${userColumnsResponse}
    `;
    const queryResult = await executeQuery(query, queryParams);
    if (!queryResult || queryResult.rows.length !== 1) {
      throw new Error('Failed to create a new User. Database error.');
    }
    const userCreated = queryResult.rows[0];
    res.status(201).json(userCreated);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
    next(error);
  }
});

// API: Update User
userRoutes.put('/', authenticateUser, async (req, res, next) => {
  try {
    const user = JSON.parse(JSON.stringify(req.body));
    if (!user || !user.userId) {
      throw new Error('Failed to update User. Invalid data received.');
    }
    user.updateUser = req.params.currentUserId;
    const queryParams = [
      user.userId,
      user.firstName,
      user.lastName,
      user.email,
      user.photoURL,
      user.access,
      user.updateUser
    ];
    const query = `
      UPDATE users
      SET
        first_name = $2,
        last_name = $3,
        email = $4,
        photo_url = $5,
        access = $6,
        update_user = $7,
        update_date = now()
      WHERE user_id = $1
      RETURNING ${userColumnsResponse}
    `;
    const queryResult = await executeQuery(query, queryParams);
    if (!queryResult || queryResult.rows.length !== 1) {
      throw new Error('Failed to update User. Database error.');
    }
    const userUpdated = queryResult.rows[0];
    res.status(201).json(userUpdated);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
    next(error);
  }
});

// API: Update User Password
userRoutes.put('/password', authenticateUser, async (req, res, next) => {
  try {
    const user = JSON.parse(JSON.stringify(req.body));
    const currentUserAccess = await getUserAccess(req.params.currentUserId);
    if (!user || !user.userId || (!user.password && currentUserAccess !== 'admin')) {
      throw new Error('Failed to update User. Invalid data received.');
    }
    if (currentUserAccess !== 'admin' || user.password) {
      // Validate Old Password
      const hashPassword = await getUserPassword(user.userId);
      if (!hashPassword) throw new Error('Failed to update User. Database error.');
      const validPassword = await bcrypt.compare(user.password, hashPassword);
      if (!validPassword) throw new Error('Failed to update User. Invalid password.');
    }
    // Update new Password
    user.password = await bcrypt.hash(user.newPassword, 10);
    user.updateUser = req.params.currentUserId;
    const queryParams = [
      user.userId,
      user.password,
      user.updateUser
    ];
    const query = `
      UPDATE users
      SET
        password = $2,
        update_user = $3,
        update_date = now()
      WHERE user_id = $1
      RETURNING ${userColumnsResponse}
    `;
    const queryResult = await executeQuery(query, queryParams);
    if (!queryResult || queryResult.rows.length !== 1) {
      throw new Error('Failed to update User. Database error.');
    }
    const userUpdated = queryResult.rows[0];
    res.status(201).json(userUpdated);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
    next(error);
  }
});

// API: Delete User
userRoutes.delete('/:userId', authenticateUser, async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const queryParams = [userId];
    const query = `
			DELETE FROM users
			WHERE user_id = $1
			RETURNING ${userColumnsResponse}
		`;
    const queryResult = await executeQuery(query, queryParams);
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
    next(error);
  }
});

// API: Delete ALL Users
userRoutes.delete('/', authenticateUser, async (req, res, next) => {
  try {
    const queryParams = [];
    const query = `
			DELETE FROM users
    `;
    const queryResult = await executeQuery(query, queryParams);
    const result = queryResult.rows;
    if (result.length !== 0) {
      throw new Error('Failed to delete All Users.');
    }
    res.status(201).json({ message: 'Success. All Users Deleted.' });
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
}

async function getUserAccess(userId) {
  const queryParams = [userId];
  const query = `
    SELECT access
    FROM users
    WHERE user_id = $1
  `;
  const queryResult = await executeQuery(query, queryParams);
  // User not found
  if (!queryResult || queryResult.rows.length !== 1) {
    return null;
  }
  const userAccess = queryResult.rows[0].access;
  return userAccess;
}

// ### Module exports
module.exports = {
  userRoutes: userRoutes,
  getUserPassword: getUserPassword
};