-- DEMO USERS
--
INSERT INTO
  users(user_id, password, first_name, email)
VALUES
  (
    'demo',
    '$2b$10$WOpYDJX/Y9y7QA2PFfAFWeySgff5rPbi4RjNlazRNMcvzztYSn5i6',
    'Demo User',
    'demo-user@demo.com'
  );

INSERT INTO
  users(user_id, password, first_name, email, access)
VALUES
  (
    'demo-admin',
    '$2b$10$WOpYDJX/Y9y7QA2PFfAFWeySgff5rPbi4RjNlazRNMcvzztYSn5i6',
    'Demo Admin User',
    'demo-admin-user@demo.com',
    'admin'
  );