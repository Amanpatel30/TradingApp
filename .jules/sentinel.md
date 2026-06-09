## 2024-05-20 - [Privilege Escalation via Registration]
**Vulnerability:** The registration endpoint allowed users to specify their `role` in the request body, potentially enabling them to create admin accounts.
**Learning:** Even if the default in the schema is 'user', allowing the field to be passed in `req.body` and using it in `User.create` (mass assignment) can bypass intended security controls.
**Prevention:** Always whitelist or hardcode sensitive fields like `role` in controllers, especially in public-facing endpoints.
