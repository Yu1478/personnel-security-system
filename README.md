# 人员安全管理系统

一个基于 `Node.js + Express + MySQL` 的课程演示项目，重点展示人员账号安全管理，而不是完整的人事业务流程。

## 项目能力

- 注册 / 登录
- JWT 鉴权
- RBAC 角色权限控制
- MFA(TOTP) 多因素认证
- 审计日志
- 离职冻结

## 默认演示账号

- `admin1 / 123456`
- `employee01 / 123456`
- `auditor01 / 123456`

服务启动时会自动修复演示账号状态、角色和默认密码，适合重复演示。

## 常用命令

```bash
npm start
npm run dev
npm run reset-demo
```

`npm run reset-demo` 可在演示前重置默认账号、角色和 MFA 状态。

## 页面入口

- `/` 系统总览
- `/users.html` 用户与权限
- `/security.html` 安全认证
- `/audit.html` 审计日志

## 主要接口

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/mfa/setup`
- `POST /api/auth/mfa/verify`
- `GET /api/auth/me`
- `GET /api/users/me`
- `GET /api/users`
- `PUT /api/users/:id/roles`
- `POST /api/users/:id/leave`
- `GET /api/audit/logs`

## 代码结构

```text
src/
  app.js
  server.js
  init/
    bootstrap.js
  config/
    db.js
    jwt.js
  controller/
    authController.js
    userController.js
    auditController.js
    mfaController.js
  dao/
    userDao.js
    rbacDao.js
    auditDao.js
  middleware/
    auth.js
    permission.js
  routes/
    authRoutes.js
    userRoutes.js
    auditRoutes.js
  service/
    authService.js
  utils/
    response.js
scripts/
  reset-demo.js
sql/
  schema.sql
public/
  index.html
  users.html
  security.html
  audit.html
```
