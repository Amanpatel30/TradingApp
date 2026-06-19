## 2025-05-15 - [Privilege Escalation in User Registration]
**Vulnerability:** The registration endpoint allowed users to specify their own `role` in the request body, enabling any user to register as an 'admin'.
**Learning:** Destructuring `req.body` directly into service calls without explicit field whitelisting or hardcoding sensitive fields can lead to mass assignment and privilege escalation.
**Prevention:** Always hardcode or whitelist sensitive fields like `role`, `permissions`, or `balance` in public-facing controllers.
