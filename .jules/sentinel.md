# SENTINEL'S JOURNAL - CRITICAL LEARNINGS ONLY

## 2026-06-21 - Privilege Escalation in User Registration
**Vulnerability:** The registration controller was accepting a `role` field directly from the request body and passing it to the registration service, allowing any user to register as an 'admin'.
**Learning:** Default parameters in destructuring (`role = 'user'`) do not protect against explicit values provided in the request body. Trusting client-provided roles without backend validation or hardcoding leads to easy privilege escalation.
**Prevention:** Always hardcode sensitive fields like 'role' on registration or use a strict whitelist/validation that only allows standard user roles. Never pass the entire request body or unvalidated role fields to services that create users.

## 2026-06-29 - Sensitive Data Exposure in Centralized Error Logs
**Vulnerability:** The global error handler middleware was logging the entire `req.body`, `req.params`, and `req.query` objects on failure, potentially exposing plaintext passwords and tokens in production logs.
**Learning:** Centralized logging is a powerful debugging tool but can become a liability if it captures un-sanitized request data. Circular references in complex objects (like self-referencing arrays or deeply nested structures) must be handled explicitly during sanitization to avoid stack overflows.
**Prevention:** Implement a recursive sanitization utility that redacts sensitive fields (case-insensitively) and use it in all logging middlewares. Always use a `WeakSet` to track visited objects and prevent infinite recursion.
