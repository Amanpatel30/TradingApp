## 2025-05-15 - Privilege Escalation via Mass Assignment in Registration
**Vulnerability:** User registration allowed the `role` field to be passed in the request body, which was then passed directly to the user creation service.
**Learning:** Defaulting or allowing the `role` field from user input enables any user to register as an 'admin'.
**Prevention:** Always explicitly pick only the allowed fields from `req.body` and hardcode sensitive defaults like roles in the controller layer.

## 2025-05-15 - Sensitive Data Exposure in Logs
**Vulnerability:** The global error handler logged the raw `req.body`, potentially exposing passwords and tokens in plaintext log files.
**Learning:** Developers often log entire request objects for debugging, forgetting that they contain PII or secrets.
**Prevention:** Implement a recursive sanitization utility to mask fields like `password`, `token`, and `secret` before logging.
