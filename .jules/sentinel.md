<<<<<<< HEAD
## 2026-05-29 - [Mass Assignment in User Registration]
**Vulnerability:** The registration endpoint allowed users to specify a `role` field in the request body, enabling potential privilege escalation to 'admin'.
**Learning:** Even if the controller manually extracts fields, using a validation schema (like Zod) that explicitly defines allowed fields is more robust and prevents accidental inclusion of sensitive fields when passing the object down to services.
**Prevention:** Use Zod schemas with `validateRequest` middleware to sanitize all incoming request bodies, ensuring only authorized fields are processed by the application logic.
=======
# SENTINEL'S JOURNAL - CRITICAL LEARNINGS ONLY

## 2026-06-21 - Privilege Escalation in User Registration
**Vulnerability:** The registration controller was accepting a `role` field directly from the request body and passing it to the registration service, allowing any user to register as an 'admin'.
**Learning:** Default parameters in destructuring (`role = 'user'`) do not protect against explicit values provided in the request body. Trusting client-provided roles without backend validation or hardcoding leads to easy privilege escalation.
**Prevention:** Always hardcode sensitive fields like 'role' on registration or use a strict whitelist/validation that only allows standard user roles. Never pass the entire request body or unvalidated role fields to services that create users.

test ci trigger
>>>>>>> master
