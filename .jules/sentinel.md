## 2026-06-14 - Privilege Escalation via Mass Assignment in Registration
**Vulnerability:** User registration endpoint extracted the `role` field directly from `req.body`, allowing users to self-assign the 'admin' role.
**Learning:** Even when a default role is specified (e.g., `role = 'user'`), destructuring it from `req.body` without validation allows it to be overridden by the client.
**Prevention:** Explicitly destructure only the required and safe fields from request bodies, or hardcode sensitive fields like roles on creation.
