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
    const response: QueryResult = await executeQery(query, queryParams);
    const usersList: User[] = response.rows;
    res.status(200).json(usersList);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error.' });
    next(e);
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
    const response: QueryResult = await executeQery(query, queryParams);
    const userSelected: User = response.rows[0];
    if (!response || !userSelected) {
      // throw new Error('Nof found!');
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    res.status(200).json(userSelected);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error.' });
    next(e);
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
    const response: QueryResult = await executeQery(query, queryParams);
    const userCreated: User = response.rows[0];
    if (!response || !userCreated) {
      throw new Error('Failed to create a new User.');
    }
    res.status(201).json(userCreated);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error.' });
    next(e);
  }
});

// Delete ALL Users
userRoutes.delete('/', authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const queryParams: string[] = [];
    const query: string = `
			DELETE FROM users
    `;
    const response: QueryResult = await executeQery(query, queryParams);
    const result: any[] = response.rows;
    if (result.length !== 0) {
      throw new Error('Failed to delete All Users.');
    }
    res.status(201).json({ message: 'All Users Deleted.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error.' });
    next(error);
  }
});
