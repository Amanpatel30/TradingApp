## 2025-05-14 - Privilege Escalation via Registration

**Vulnerability:** The registration controller was extracting the `role` field from the request body and passing it directly to the registration service.

**Learning:** Any user could register themselves as an admin by simply including `"role": "admin"` in their registration request. Trusting client-side input for sensitive fields like user roles is a common but critical oversight.

**Prevention:** Always hardcode sensitive default values (like roles) on the server side for public endpoints. Use a whitelist approach for what fields can be updated or set by the user.

---

## 2025-05-14 - Sensitive Data Exposure in Logs

**Vulnerability:** The centralized error handler was logging the raw `req.body`, which could contain plain-text passwords and other sensitive tokens.

**Learning:** While detailed logs are helpful for debugging, they can become a security risk if they capture and store credentials.

**Prevention:** Implement a recursive masking utility to redact sensitive fields before they are passed to any logging mechanism.
