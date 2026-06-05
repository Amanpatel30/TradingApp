# Sentinel Security Journal

## 2025-05-14 - Initial Scan
**Vulnerability:** Found hardcoded default secrets in `backend/src/config/config.js` and privilege escalation vulnerability in `backend/src/modules/auth/controllers/register.js` where the 'role' can be supplied by the user. Also, sensitive data like passwords might be logged in `backend/src/middlewares/error-handler.js`.
**Learning:** Default values for secrets are often left in configuration files for developer convenience but pose a risk if not overridden. Input validation should be strict, especially for fields like 'role'.
**Prevention:** Always use environment variables for secrets without defaults in production. Use Zod or similar for strict input validation and sanitization.
