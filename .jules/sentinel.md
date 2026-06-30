# SENTINEL'S JOURNAL - CRITICAL LEARNINGS ONLY

## 2026-06-30 - Sensitive Data Exposure in Error Logs
**Vulnerability:** The centralized error handler was logging the raw `req.body`, `req.params`, and `req.query` objects. If an error occurred during authentication (e.g., login/register validation failure), plaintext passwords and tokens were written to the server logs.
**Learning:** Logging entire request objects for debugging is convenient but dangerous. Error handlers are especially risky because they often trigger on validation failures before data is sanitized by business logic.
**Prevention:** Implement a recursive sanitization utility that redacts a blacklist of sensitive keys (password, token, etc.) before logging any request data.

## 2026-06-21 - Privilege Escalation in User Registration
**Vulnerability:** The registration controller was accepting a `role` field directly from the request body and passing it to the registration service, allowing any user to register as an 'admin'.
**Learning:** Default parameters in destructuring (`role = 'user'`) do not protect against explicit values provided in the request body. Trusting client-provided roles without backend validation or hardcoding leads to easy privilege escalation.
**Prevention:** Always hardcode sensitive fields like 'role' on registration or use a strict whitelist/validation that only allows standard user roles. Never pass the entire request body or unvalidated role fields to services that create users.
