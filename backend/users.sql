CREATE TABLE IF NOT EXISTS `production-dashboard-482014.dashboard_data.users` (
  email STRING NOT NULL,
  password_hash STRING NOT NULL,
  role STRING,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);
