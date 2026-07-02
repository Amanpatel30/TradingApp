# SENTINEL'S JOURNAL - CRITICAL LEARNINGS ONLY

## 2026-06-21 - Privilege Escalation in User Registration
**Vulnerability:** The registration controller was accepting a `role` field directly from the request body and passing it to the registration service, allowing any user to register as an 'admin'.
**Learning:** Default parameters in destructuring (`role = 'user'`) do not protect against explicit values provided in the request body. Trusting client-provided roles without backend validation or hardcoding leads to easy privilege escalation.
**Prevention:** Always hardcode sensitive fields like 'role' on registration or use a strict whitelist/validation that only allows standard user roles. Never pass the entire request body or unvalidated role fields to services that create users.

## 2026-07-02 - Sensitive Data Exposure in Error Logs
**Vulnerability:** The centralized error handler logged full request objects (`body`, `params`, `query`) on failure, leading to plaintext passwords and tokens being written to server logs.
**Learning:** Centralized logging of request context is vital for debugging but must be balanced with data privacy. Without a robust sanitization layer, any error during authentication flows becomes a credential leak.
**Prevention:** Implement a recursive sanitization utility that redacts a blacklist of sensitive fields (password, token, secret, etc.) from any object before it is passed to a logging service.
