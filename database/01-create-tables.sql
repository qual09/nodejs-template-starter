-- users
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  user_id text PRIMARY KEY,
  password text NOT NULL,
  first_name text,
  last_name text,
  email text,
  photo_url text,
  access text DEFAULT 'user',
  create_date timestamp DEFAULT now(),
  create_user text,
  update_date timestamp DEFAULT now(),
  update_user text
);
