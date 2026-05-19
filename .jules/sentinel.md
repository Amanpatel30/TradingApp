## 2025-05-19 - Prevention of Mass Assignment in User Registration
**Vulnerability:** The registration endpoint allowed users to specify their `role` (e.g., 'admin') directly in the request body, leading to potential privilege escalation.
**Learning:** The controller was destructuring the entire `req.body` or taking the `role` directly from it without validation, trusting client-provided data for sensitive fields.
**Prevention:** Always whitelist allowed fields when destructuring `req.body` and explicitly set sensitive fields like `role` or `status` in the backend code, rather than relying on client input.
