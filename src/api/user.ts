import { Router, Request, Response, NextFunction } from 'express';
import { QueryResult, QueryResultRow } from 'pg';
import { executeQuery } from '../db/postgres';
import { authenticateUser } from '../utils/auth';
import { User } from '../models/user';
import bcrypt from 'bcrypt';

export const userRoutes: Router = Router();

const dbSchema: string = process.env.DB_SCHEMA || 'public';
const userColumnsResponse: string = `
  user_id as "userId",
  first_name as "firstName",
  last_name as "lastName",
  email,
  photo_url as "photoURL",
  login_date as "loginDate",
  access,
  create_date as "createDate",
  create_user as "createUser",
  update_date as "updateDate",
  update_user as "updateUser"
`;

// ### API: Get Users List
userRoutes.get('/', authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const startIndex: number = (Number(req.query.page) - 1) * Number(req.query.limit) || 0;
    const endIndex: number = Number(req.query.limit) || 1000;
    const queryParams: string[] | number[] | null = [];
    const query: string = `
      SELECT ${userColumnsResponse}
      FROM ${dbSchema}.users
      OFFSET ${startIndex}
      LIMIT ${endIndex}
    `;
    const queryResult: QueryResult = await executeQuery(query, queryParams);
    const usersList: User[] = queryResult.rows;
    res.status(200).json(usersList);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
    next(error);
  }
});

// ### API: Get User by ID
userRoutes.get('/:userId', authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId: string = req.params.userId;
    const queryParams: string[] = [userId];
    const query: string = `
      SELECT ${userColumnsResponse}
      FROM ${dbSchema}.users
      WHERE user_id = $1
      LIMIT 10
    `;
    const queryResult: QueryResult = await executeQuery(query, queryParams);
    if (!queryResult || queryResult.rows.length !== 1) {
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

// ### API: Search Users by Email
userRoutes.get('/email/:email', authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email: string = req.params.email;
    const queryParams: string[] = [email];
    const query: string = `
      SELECT ${userColumnsResponse}
      FROM ${dbSchema}.users
      WHERE email like '%' || $1 || '%'
      LIMIT 10
    `;
    const queryResult: QueryResult = await executeQuery(query, queryParams);
    if (!queryResult || queryResult.rows.length < 1) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    const usersSelected: User[] = queryResult.rows;
    res.status(200).json(usersSelected);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
    next(error);
  }
});

// ### API: Create New User
userRoutes.post('/', authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user: User = JSON.parse(JSON.stringify(req.body));
    if (!user || !user.password || !user.firstName) {
      throw new Error('Failed to create a new User. Error code: UIDRC500');
    }
    if (!user.userId) {
      user.userId = generateUID();
    }
    user.createUser = req.params.currentUserId;
    user.password = await bcrypt.hash(user.password, 10);
    const queryParams: (string | number | null)[] = [
      user.userId,
      user.password,
      user.firstName,
      user.lastName,
      user.email,
      user.photoURL,
      user.loginDate,
      user.access,
      user.createUser
    ];
    const query: string = `
      INSERT INTO ${dbSchema}.users (
        user_id,
        password,
        first_name,
        last_name,
        email,
        photo_url,
        login_date,
        access,
        create_user
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT DO NOTHING
      RETURNING ${userColumnsResponse}
    `;
    const queryResult: QueryResult = await executeQuery(query, queryParams);
    if (!queryResult || queryResult.rows.length !== 1) {
      throw new Error('Failed to create a new User. Error code: UDBRI500');
    }
    const userCreated: User = queryResult.rows[0];
    res.status(201).json(userCreated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
    next(error);
  }
});

// ### API: Update User
userRoutes.put('/', authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user: User = JSON.parse(JSON.stringify(req.body));
    if (!user || !user.userId) {
      throw new Error('Failed to update User. Error code: UIDRU500');
    }
    user.updateUser = req.params.currentUserId;
    const queryParams: (string | number | boolean | null)[] = [
      user.userId,
      user.firstName,
      user.lastName,
      user.email,
      user.photoURL,
      user.access,
      user.updateUser
    ];
    const query: string = `
      UPDATE ${dbSchema}.users
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
    const queryResult: QueryResult = await executeQuery(query, queryParams);
    if (!queryResult || queryResult.rows.length !== 1) {
      throw new Error('Failed to update User. Error code: UDBR500');
    }
    const userUpdated: User = queryResult.rows[0];
    res.status(201).json(userUpdated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
    next(error);
  }
});

// ### API: Update User Password
userRoutes.put('/password', authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user: User = JSON.parse(JSON.stringify(req.body));
    const currentUserAccess: string | null = await getUserAccess(req.params.currentUserId);
    if (!user || !user.userId || (!user.password && currentUserAccess !== 'admin')) {
      throw new Error('Failed to update User. Error code: UIDRP500');
    }
    if (currentUserAccess !== 'admin' || user.password) {
      // Validate Old Password
      const hashPassword = await getUserPassword(user.userId);
      if (!hashPassword) throw new Error('Failed to update User. Error code: UHP500');
      const validPassword = await bcrypt.compare(user.password, hashPassword);
      if (!validPassword) throw new Error('Failed to update User. Error code: UVP500');
    }
    // Update new Password
    user.password = await bcrypt.hash(user.newPassword, 10);
    user.updateUser = req.params.currentUserId;
    const queryParams: (string | number | boolean | null)[] = [
      user.userId,
      user.password,
      user.updateUser
    ];
    const query: string = `
      UPDATE ${dbSchema}.users
      SET
        password = $2,
        update_user = $3,
        update_date = now()
      WHERE user_id = $1
      RETURNING ${userColumnsResponse}
    `;
    const queryResult: QueryResult = await executeQuery(query, queryParams);
    if (!queryResult || queryResult.rows.length !== 1) {
      throw new Error('Failed to update User. Error code: UDBR500');
    }
    const userUpdated: User = queryResult.rows[0];
    res.status(201).json(userUpdated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
    next(error);
  }
});

// ### API: Delete User
userRoutes.delete('/:userId', authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId: string = req.params.userId;
    const queryParams: string[] = [userId];
    const query: string = `
			DELETE FROM ${dbSchema}.users
			WHERE user_id = $1
			RETURNING ${userColumnsResponse}
		`;
    const queryResult: QueryResult = await executeQuery(query, queryParams);
    if (queryResult.rows.length !== 1) {
      throw new Error('Failed to delete User. Error code: UDBDU500');
    }
    res.status(201).json({ message: 'Success. User Deleted.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
    next(error);
  }
});

// ### API: Delete ALL Users
userRoutes.delete('/', authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const queryParams: string[] = [];
    const query: string = `
			DELETE FROM users
    `;
    const queryResult: QueryResult = await executeQuery(query, queryParams);
    const result: QueryResultRow[] = queryResult.rows;
    if (result.length !== 0) {
      throw new Error('Failed to delete All Users. Error code: UDBRD500');
    }
    res.status(201).json({ message: 'Success. All Users Deleted.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
    next(error);
  }
});

function generateUID(): string {
  // Generate the UID from two parts,
  // to ensure the random number provide enough bits.
  let firstPart: string = String((Math.random() * 46656) | 0);
  let secondPart: string = String((Math.random() * 46656) | 0);
  firstPart = ('000' + firstPart).slice(-3);
  secondPart = ('000' + secondPart).slice(-3);
  return firstPart + secondPart;
}

export async function getUserPassword(userId: string) {
  const queryParams: string[] = [userId];
  const query: string = `
    SELECT password
    FROM ${dbSchema}.users
    WHERE user_id = $1
    LIMIT 10
  `;
  const queryResult: QueryResult = await executeQuery(query, queryParams);
  // User not found
  if (!queryResult || queryResult.rows.length !== 1) {
    return null;
  }
  const userPassword: string = queryResult.rows[0].password;
  return userPassword;
}

export async function getUserAccess(userId: string) {
  const queryParams: string[] = [userId];
  const query: string = `
    SELECT access
    FROM ${dbSchema}.users
    WHERE user_id = $1
    LIMIT 10
  `;
  const queryResult: QueryResult = await executeQuery(query, queryParams);
  // User not found
  if (!queryResult || queryResult.rows.length !== 1) {
    return null;
  }
  const userAccess: string = queryResult.rows[0].access;
  return userAccess;
}

export async function updateUserLoginDate(userId: string) {
  const queryParams: string[] = [userId];
  const query: string = `
    UPDATE ${dbSchema}.users
    SET login_date = now()
    WHERE user_id = $1
    RETURNING ${userColumnsResponse}
  `;
  const queryResult: QueryResult = await executeQuery(query, queryParams);
  // User not found
  if (!queryResult || queryResult.rows.length !== 1) {
    return null;
  }
  return queryResult.rows[0].loginDate;
}
