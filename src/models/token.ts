import { GlobalModel } from './global';

export interface Token extends GlobalModel {
  token_id: number;
  user_id: string;
  access_token: string;
  refresh_token: string;
  grant_type: string;
}
