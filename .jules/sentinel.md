## 2026-05-20 - [Mask Sensitive Data in Error Logs]
**Vulnerability:** Sensitive data exposure in logs. The centralized error handler was logging the full `req.body`, which included passwords and tokens.
**Learning:** Centralized error handlers are high-value targets for both security fixes and potential leaks because they handle data from all parts of the application.
**Prevention:** Always sanitize or mask request data before passing it to loggers. Implement a utility that can be reused across different middleware or controllers.
