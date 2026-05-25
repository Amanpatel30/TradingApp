## 2025-05-23 - [Privilege Escalation via Mass Assignment in Registration]
**Vulnerability:** The registration controller destructured the `role` field directly from `req.body`, allowing new users to register themselves with administrative privileges by simply including `"role": "admin"` in their request.
**Learning:** Mass assignment vulnerabilities are common in endpoints that accept JSON bodies. Even with defaults like `role = 'user'`, an explicit override from the client can bypass intended security constraints if the input is not strictly filtered.
**Prevention:** Always explicitly define the fields extracted from request bodies and hardcode sensitive attributes (like roles or permissions) that should not be client-controlled during self-service operations like registration.
