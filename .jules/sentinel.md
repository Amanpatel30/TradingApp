# SENTINEL'S JOURNAL - CRITICAL LEARNINGS ONLY

## 2026-06-21 - Privilege Escalation in User Registration
**Vulnerability:** The registration controller was accepting a `role` field directly from the request body and passing it to the registration service, allowing any user to register as an 'admin'.
**Learning:** Default parameters in destructuring (`role = 'user'`) do not protect against explicit values provided in the request body. Trusting client-provided roles without backend validation or hardcoding leads to easy privilege escalation.
**Prevention:** Always hardcode sensitive fields like 'role' on registration or use a strict whitelist/validation that only allows standard user roles. Never pass the entire request body or unvalidated role fields to services that create users.

## 2026-06-24 - Sensitive Data Exposure in Logs
**Vulnerability:** The centralized error handler was logging the entire `req.body` without sanitization. This caused user passwords and other sensitive tokens to be written in plain text to the application logs whenever an error occurred.
**Learning:** Logging request bodies is useful for debugging, but it's a critical security risk if not handled carefully. A global error handler is particularly dangerous as it catches errors from all routes, including authentication endpoints.
**Prevention:** Implement a recursive sanitization utility that redacts a whitelist of sensitive keys (password, token, etc.) and apply it to all request data before it is logged.
