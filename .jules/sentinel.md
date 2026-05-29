## 2026-05-29 - [Mass Assignment in User Registration]
**Vulnerability:** The registration endpoint allowed users to specify a `role` field in the request body, enabling potential privilege escalation to 'admin'.
**Learning:** Even if the controller manually extracts fields, using a validation schema (like Zod) that explicitly defines allowed fields is more robust and prevents accidental inclusion of sensitive fields when passing the object down to services.
**Prevention:** Use Zod schemas with `validateRequest` middleware to sanitize all incoming request bodies, ensuring only authorized fields are processed by the application logic.
