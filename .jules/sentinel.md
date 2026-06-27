# SENTINEL'S JOURNAL - CRITICAL LEARNINGS ONLY

## 2026-06-21 - Privilege Escalation in User Registration
**Vulnerability:** The registration controller was accepting a `role` field directly from the request body and passing it to the registration service, allowing any user to register as an 'admin'.
**Learning:** Default parameters in destructuring (`role = 'user'`) do not protect against explicit values provided in the request body. Trusting client-provided roles without backend validation or hardcoding leads to easy privilege escalation.
**Prevention:** Always hardcode sensitive fields like 'role' on registration or use a strict whitelist/validation that only allows standard user roles. Never pass the entire request body or unvalidated role fields to services that create users.

## 2026-06-22 - Sensitive Data Exposure in Logs
**Vulnerability:** The centralized error handler was logging the entire `req.body`, `req.params`, and `req.query` when an error occurred, potentially exposing cleartext passwords and tokens in the logs.
**Learning:** Global error handlers are convenient for debugging but can accidentally leak sensitive data if not carefully implemented. Sanitizing all request data before logging is a necessary safety net.
**Prevention:** Implement a recursive sanitization utility that redacts known sensitive fields (e.g., 'password', 'token', 'secret') and use it in all logging middleware and error handlers.
