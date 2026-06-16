# 🛡️ Sentinel Journal

## 2025-05-14 - Privilege Escalation in Registration
**Vulnerability:** The `register` controller in `backend/src/modules/auth/controllers/register.js` was destructuring `role` directly from `req.body` and passing it to the `authService.register` method.
**Learning:** Publicly accessible registration endpoints should never trust the `role` field from the request body.
**Prevention:** Explicitly hardcode the default role (e.g., 'user') in the controller and avoid destructuring sensitive fields that should be managed by the system.

## 2025-05-14 - Sensitive Data Exposure in Logs
**Vulnerability:** The centralized error handler in `backend/src/middlewares/error-handler.js` logged the entire `req.body` when an error occurred.
**Learning:** Error handlers often log request context for debugging, but this can inadvertently leak sensitive information like passwords if not carefully filtered.
**Prevention:** Implement a redaction mechanism to mask sensitive fields (e.g., `password`, `token`) before logging request data.
