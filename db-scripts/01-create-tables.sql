-- users
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  user_id text PRIMARY KEY,
  password text NOT NULL,
  first_name text,
  last_name text,
  email text,
  photo_url text,
  approver boolean default false,
  create_date timestamp default now(),
  create_operator text,
  update_date timestamp,
  update_operator text
);

-- tokens
DROP TABLE IF EXISTS tokens CASCADE;

CREATE TABLE tokens (
  token_id SERIAL PRIMARY KEY,
  refresh_token text NOT NULL,
  user_id text NOT NULL,
  CONSTRAINT fk_user_id FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);