# Sentinel Security Journal

## 2025-06-17 - Privilege Escalation via User Registration
**Vulnerability:** The registration endpoint allowed users to specify their `role` in the request body (e.g., `{"role": "admin"}`), which was then used to create the user account in the database.
**Learning:** Even if a default value is provided in code (`role = 'user'`), extracting it from `req.body` without validation or filtering allows malicious users to override the default.
**Prevention:** Sensitive fields like roles, permissions, or balances should never be accepted directly from user input during registration. Always hardcode these to the safest default at the controller level or use strict whitelisting.
