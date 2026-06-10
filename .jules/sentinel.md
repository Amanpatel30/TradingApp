# Sentinel's Journal - Critical Learnings

## 2026-06-10 - Sensitive Data Leakage in Centralized Error Handler
**Vulnerability:** The centralized error handler logged unredacted request bodies, potentially leaking passwords and tokens to application logs.
**Learning:** Default error handlers that log the full request object are a common source of sensitive data exposure.
**Prevention:** Always use a redaction utility to mask known sensitive fields before logging request objects in error handlers or middleware.

## 2026-06-10 - Privilege Escalation via Mass Assignment in Registration
**Vulnerability:** The registration controller allowed a 'role' field from the request body, which could allow users to register as 'admin'.
**Learning:** Destructuring req.body directly into a database create/update call without explicit field whitelisting is dangerous.
**Prevention:** Explicitly extract only allowed fields from req.body and hardcode sensitive defaults (like roles) in user-facing registration endpoints.
