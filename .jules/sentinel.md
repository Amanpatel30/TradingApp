## 2026-06-18 - Sensitive Data Exposure in Centralized Error Handler
**Vulnerability:** The centralized error handler was logging the entire `req.body` object without sanitization, leading to sensitive information like passwords and authentication tokens being stored in plaintext in the application logs.
**Learning:** Generic error handlers that log request metadata for debugging can inadvertently become a source of sensitive data leakage if they don't implement a sanitization layer for request bodies.
**Prevention:** Always implement a sanitization utility to mask known sensitive fields (e.g., password, token, secret) before logging request objects or passing them to external monitoring services.
