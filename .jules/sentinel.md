## 2026-06-12 - [Redact sensitive data in logs]
**Vulnerability:** Sensitive data like passwords and tokens were being logged in the clear by the centralized error handler when an error occurred during a request.
**Learning:** Even with a centralized error handler, logging the entire `req.body` without sanitization can lead to accidental exposure of secrets in log files.
**Prevention:** Always use a redaction utility to mask known sensitive fields before logging request objects.

## 2026-06-12 - [Privilege Escalation via Register]
**Vulnerability:** User registration endpoint accepted a `role` field from the request body, allowing any user to register as an 'admin'.
**Learning:** Mass assignment on user creation can lead to critical privilege escalation.
**Prevention:** Hardcode the default role for public registration endpoints or strictly validate and authorize role assignments.
