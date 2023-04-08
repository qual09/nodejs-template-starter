import { GlobalModel } from './global';

export interface User extends GlobalModel {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL: string;
  access: 'admin' | 'user' | 'manager';
  password: string;
  newPassword: string;
}
