## 2026-05-21 - Privilege Escalation via Mass Assignment in Registration
**Vulnerability:** The registration endpoint (`/api/v1/auth/register`) accepted a `role` field from the request body, allowing users to register themselves with 'admin' privileges.
**Learning:** Extracting the entire request body or even specific sensitive fields like `role` from user input without validation or hardcoding defaults in the controller can lead to privilege escalation.
**Prevention:** Use strict schema validation (e.g., Zod with `.strict()`) to reject unknown fields and explicitly set sensitive fields (like `role`, `balance`, etc.) in the backend logic instead of relying on user input.

## 2026-05-21 - Sensitive Data Exposure in Logs
**Vulnerability:** The centralized error handler logged the entire request body when an error occurred, potentially exposing passwords, tokens, and other sensitive information in log files.
**Learning:** Default error logging often includes request payloads for debugging, but this can inadvertently leak PII and credentials if not sanitized.
**Prevention:** Implement a recursive masking utility to redact known sensitive fields before passing data to the logger in error handlers or middleware.
