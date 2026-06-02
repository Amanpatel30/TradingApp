## 2025-05-22 - Registration Privilege Escalation
**Vulnerability:** User registration endpoint allowed specifying a `role` in the request body, which was then passed directly to the database.
**Learning:** Destructuring the entire `req.body` and passing it to a creation service can lead to mass assignment vulnerabilities if administrative fields like `role` are not protected.
**Prevention:** Always explicitly define or override sensitive fields (like roles, balances, or internal IDs) in controllers rather than trusting user input from the request body.

## 2025-05-22 - Sensitive Data Exposure in Logs
**Vulnerability:** Centralized error handler logged the entire `req.body` on failure, potentially exposing plaintext passwords and session tokens in server logs.
**Learning:** Application-wide error handlers are powerful but can inadvertently leak sensitive data if they don't implement masking logic for common sensitive fields.
**Prevention:** Implement a recursive redaction helper to mask known sensitive keys (e.g., 'password', 'token') before passing request objects to logging utilities.
