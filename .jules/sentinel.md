# Sentinel Security Journal

## 2025-05-15 - Initial Security Audit

**Vulnerability:** Privilege Escalation in User Registration
**Learning:** The registration controller was extracting `role` directly from `req.body` with a default value, but not preventing a user from providing their own value (e.g., 'admin').
**Prevention:** Always hardcode default roles for public registration endpoints or strictly validate them against an allowed list that excludes administrative roles.

**Vulnerability:** Sensitive Data Leakage in Error Logs
**Learning:** The centralized error handler logged the entire `req.body`, `req.params`, and `req.query` without redaction. This could lead to passwords or authentication tokens being stored in plaintext in the log files.
**Prevention:** Implement a redaction utility to mask sensitive fields before logging request data.

**Vulnerability:** Hardcoded Secrets in Configuration
**Learning:** `backend/src/config/config.js` contained fallback hardcoded strings for JWT secrets. If environment variables are missing, the application would fail back to insecure, well-known secrets.
**Prevention:** Never provide fallback defaults for security-sensitive configuration. The application should fail to start if required secrets are missing in production.
