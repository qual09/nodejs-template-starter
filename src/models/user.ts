import { GlobalModel } from "./global";

export interface User extends GlobalModel {
  userId: string;
  newPassword: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL: string;
  approver: boolean;
}
