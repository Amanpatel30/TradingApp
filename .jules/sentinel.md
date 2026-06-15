# Sentinel Security Journal

## 2025-06-15 - Privilege Escalation in Public Registration
**Vulnerability:** The registration endpoint allowed users to specify their own `role` (e.g., "admin") in the request body, which was then saved to the database.
**Learning:** Destructuring `req.body` without whitelisting or explicitly overriding sensitive fields like `role` can lead to unauthorized privilege escalation if the service layer trusts the input data.
**Prevention:** Publicly accessible registration endpoints should always hardcode the default role (e.g., "user") and ignore any role-related input from the client. Administrative roles should only be assigned through authenticated, authorized admin interfaces.
