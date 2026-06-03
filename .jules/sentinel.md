## 2026-06-03 - [Privilege Escalation via Mass Assignment]
**Vulnerability:** User registration endpoint allowed clients to specify their own role (e.g., 'admin') in the request body.
**Learning:** The controller was using destructuring with a default value `const { role = 'user' } = req.body`, which allowed the provided value to override the default.
**Prevention:** Hardcode sensitive fields that should not be client-controlled, or use strict allow-lists for input validation (e.g., Zod schemas that exclude sensitive fields).
