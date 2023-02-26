import { Router, Request, Response, NextFunction } from 'express';
import { QueryResult } from 'pg';
import bcrypt from 'bcrypt';
import { executeQery } from '../db/query';
import { User } from '../models/user';
import { authenticateUser } from '../utils/auth';

export const userRoutes: Router = Router();

const userColumns: string = `
  user_id,
  password,
  first_name,
  last_name,
  email,
  photo_url,
  approver,
  create_user,
  update_user
`;

const userColumnsResponse: string = `
  user_id as "userId",
  first_name as "firstName",
  last_name as "lastName",
  email,
  photo_url as "photoURL",
  approver,
  create_date as "createDate",
  create_user as "createUser",
  update_date as "updateDate",
  update_user as "updateUser"
`;

// Get Users List
userRoutes.get('/', authenticateUser, async (req, res, next) => {
  try {
    const queryParams: string[] | number[] | null = [];
    const query: string = `
      SELECT ${userColumnsResponse}
      FROM users
    `;
    const queryResult: QueryResult = await executeQery(query, queryParams);
    const usersList: User[] = queryResult.rows;
    res.status(200).json(usersList);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
    next(error);
  }
});

// Get User by ID
userRoutes.get('/:userId', authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId: string = req.params.userId;
    const queryParams: string[] = [userId];
    const query: string = `
      SELECT ${userColumnsResponse}
      FROM users
      WHERE user_id = $1
    `;
    const queryResult: QueryResult = await executeQery(query, queryParams);
    if (!queryResult || queryResult.rows.length !== 1) {
      // throw new Error('Nof found!');
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    const userSelected: User = queryResult.rows[0];
    res.status(200).json(userSelected);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
    next(error);
  }
});

// Create New User
userRoutes.post('/', authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user: User = JSON.parse(JSON.stringify(req.body));
    if (!user || !user.password) {
      throw new Error('Failed to create a new User. Invalid data received.');
    }
    user.createUser = req.params.currentUserId;
    user.updateUser = req.params.currentUserId;
    user.password = await bcrypt.hash(user.password, 10);
    const queryParams: (string | number | boolean | null)[] = [
      user.userId,
      user.password,
      user.firstName,
      user.lastName,
      user.email,
      user.photoURL,
      user.approver,
      user.createUser,
      user.updateUser
    ];
    const query: string = `
      INSERT INTO users (${userColumns})
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT DO NOTHING
      RETURNING ${userColumnsResponse}
    `;
    const queryResult: QueryResult = await executeQery(query, queryParams);
    if (!queryResult || queryResult.rows.length !== 1) {
      throw new Error('Failed to create a new User. Database error.');
    }
    const userCreated: User = queryResult.rows[0];
    res.status(201).json(userCreated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
    next(error);
  }
});

// Update User
userRoutes.put('/', authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user: User = JSON.parse(JSON.stringify(req.body));
    if (!user) {
      throw new Error('Failed to update User. Invalid data received.');
    }
    user.updateUser = req.params.currentUserId;
    const queryParams: (string | number | boolean | null)[] = [
      user.userId,
      user.firstName,
      user.lastName,
      user.email,
      user.photoURL,
      user.approver,
      user.updateUser
    ];
    const query: string = `
      UPDATE users
      SET
        first_name = $2,
        last_name = $3,
        email = $4,
        photo_url = $5,
        approver = $6,
        update_user = $7,
        update_date = now()
      WHERE user_id = $1
      RETURNING ${userColumnsResponse}
    `;
    const queryResult: QueryResult = await executeQery(query, queryParams);
    if (!queryResult || queryResult.rows.length !== 1) {
      throw new Error('Failed to update User. Database error.');
    }
    const userUpdated: User = queryResult.rows[0];
    res.status(201).json(userUpdated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
    next(error);
  }
});

// Delete User
userRoutes.delete('/:userId', authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId: string = req.params.userId;
    const queryParams: string[] = [userId];
    const query: string = `
			DELETE FROM users
			WHERE user_id = $1
			RETURNING ${userColumnsResponse}
		`;
    const queryResult: QueryResult = await executeQery(query, queryParams);
    res.sendStatus(204);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
    next(error);
  }
});

// Delete ALL Users
userRoutes.delete('/', authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const queryParams: string[] = [];
    const query: string = `
			DELETE FROM users
    `;
    const queryResult: QueryResult = await executeQery(query, queryParams);
    const result: any[] = queryResult.rows;
    if (result.length !== 0) {
      throw new Error('Failed to delete All Users.');
    }
    res.status(201).json({ message: 'Success. All Users Deleted.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
    next(error);
  }
});
