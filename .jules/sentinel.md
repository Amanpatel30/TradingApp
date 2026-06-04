## 2026-06-04 - Log Redaction for Sensitive Data
**Vulnerability:** Sensitive information like passwords, JWT tokens, and API keys were being logged in plain text by the centralized error handler whenever an error occurred during a request.
**Learning:** Centralized error handlers that log the entire `req.body` or `req.query` for debugging purposes can inadvertently leak secrets into log files or monitoring systems.
**Prevention:** Always use a redaction utility to mask known sensitive fields before passing request data to a logger, especially in error handlers that catch a wide variety of requests.
