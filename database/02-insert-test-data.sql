-- DEMO USERS
--
INSERT INTO
  users(user_id, password, first_name, email, access)
VALUES
  (
    'demo',
    '$2b$10$WOpYDJX/Y9y7QA2PFfAFWeySgff5rPbi4RjNlazRNMcvzztYSn5i6',
    'Demo User',
    'demo-user@demo.com',
    'user'
  );

INSERT INTO
  users(user_id, password, first_name, email, access)
VALUES
  (
    'demo-approver',
    '$2b$10$WOpYDJX/Y9y7QA2PFfAFWeySgff5rPbi4RjNlazRNMcvzztYSn5i6',
    'Demo Approver User',
    'demo-approver-user@demo.com',
    'admin'
  );