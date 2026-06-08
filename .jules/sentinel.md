## 2025-05-14 - Privilege Escalation in User Registration
**Vulnerability:** The registration controller was extracting the `role` field directly from `req.body`, allowing users to register as admins.
**Learning:** Defaulting values from untrusted input without sanitization or explicit overrides can lead to privilege escalation.
**Prevention:** Always hardcode sensitive fields like `role` during public registration or use a whitelist that excludes them.
