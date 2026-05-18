CREATE DATABASE IF NOT EXISTS personnel_security DEFAULT CHARSET utf8mb4;
USE personnel_security;

CREATE TABLE IF NOT EXISTS sys_user (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(64) DEFAULT NULL,
  status ENUM('ACTIVE','LOCKED','DISABLED') NOT NULL DEFAULT 'ACTIVE',
  failed_login_count INT NOT NULL DEFAULT 0,
  locked_until DATETIME DEFAULT NULL,
  last_login_at DATETIME DEFAULT NULL,
  last_login_ip VARCHAR(45) DEFAULT NULL,
  left_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sys_login_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT DEFAULT NULL,
  username VARCHAR(64) NOT NULL,
  success TINYINT(1) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  device_info VARCHAR(512) DEFAULT NULL,
  fail_reason VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_time (user_id, created_at),
  INDEX idx_username_time (username, created_at)
);

CREATE TABLE IF NOT EXISTS sys_role (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  role_code VARCHAR(64) NOT NULL UNIQUE,
  role_name VARCHAR(64) NOT NULL,
  role_desc VARCHAR(255) DEFAULT NULL,
  status TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sys_permission (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  perm_code VARCHAR(128) NOT NULL UNIQUE,
  perm_name VARCHAR(128) NOT NULL,
  resource_type VARCHAR(32) NOT NULL,
  resource_path VARCHAR(255) DEFAULT NULL,
  action VARCHAR(32) NOT NULL,
  status TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sys_user_role (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  role_id BIGINT NOT NULL,
  assigned_by BIGINT DEFAULT NULL,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_role (user_id, role_id),
  INDEX idx_role_id (role_id),
  CONSTRAINT fk_user_role_user FOREIGN KEY (user_id) REFERENCES sys_user(id),
  CONSTRAINT fk_user_role_role FOREIGN KEY (role_id) REFERENCES sys_role(id)
);

CREATE TABLE IF NOT EXISTS sys_role_permission (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  role_id BIGINT NOT NULL,
  permission_id BIGINT NOT NULL,
  UNIQUE KEY uk_role_permission (role_id, permission_id),
  INDEX idx_permission_id (permission_id),
  CONSTRAINT fk_role_permission_role FOREIGN KEY (role_id) REFERENCES sys_role(id),
  CONSTRAINT fk_role_permission_permission FOREIGN KEY (permission_id) REFERENCES sys_permission(id)
);

CREATE TABLE IF NOT EXISTS sys_mfa_factor (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  factor_type ENUM('TOTP') NOT NULL DEFAULT 'TOTP',
  secret_base32 VARCHAR(255) NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  verified_at DATETIME DEFAULT NULL,
  last_used_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_factor (user_id, factor_type),
  CONSTRAINT fk_mfa_user FOREIGN KEY (user_id) REFERENCES sys_user(id)
);

CREATE TABLE IF NOT EXISTS sys_operation_audit_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  trace_id VARCHAR(64) NOT NULL,
  operator_id BIGINT DEFAULT NULL,
  operator_name_snapshot VARCHAR(64) NOT NULL,
  operator_username_snapshot VARCHAR(64) NOT NULL,
  module VARCHAR(64) NOT NULL,
  action VARCHAR(64) NOT NULL,
  target_type VARCHAR(64) DEFAULT NULL,
  target_id VARCHAR(64) DEFAULT NULL,
  before_data JSON DEFAULT NULL,
  after_data JSON DEFAULT NULL,
  result ENUM('SUCCESS','FAIL') NOT NULL,
  error_message VARCHAR(255) DEFAULT NULL,
  ip_address VARCHAR(45) NOT NULL,
  location VARCHAR(128) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_trace_id (trace_id),
  INDEX idx_operator_time (operator_id, created_at),
  INDEX idx_target (target_type, target_id),
  CONSTRAINT fk_audit_user FOREIGN KEY (operator_id) REFERENCES sys_user(id)
);

INSERT IGNORE INTO sys_role (id, role_code, role_name, role_desc) VALUES
(1, 'EMPLOYEE', '普通员工', '只能查看自己的信息'),
(2, 'ADMIN', '管理员', '可以管理所有用户'),
(3, 'AUDITOR', '审计员', '只能查看日志');

INSERT IGNORE INTO sys_permission (id, perm_code, perm_name, resource_type, resource_path, action) VALUES
(1, 'user:self:read', '查看自己的信息', 'API', '/api/users/me', 'READ'),
(2, 'user:manage:all', '管理所有用户', 'API', '/api/users', 'MANAGE'),
(3, 'audit:log:read', '查看审计日志', 'API', '/api/audit/logs', 'READ');

INSERT IGNORE INTO sys_role_permission (role_id, permission_id) VALUES
(1, 1),
(2, 1),
(2, 2),
(2, 3),
(3, 3);
