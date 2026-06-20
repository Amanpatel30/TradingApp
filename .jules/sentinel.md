# 🛡️ Sentinel Security Journal

## 2026-06-20 - Privilege Escalation in User Registration
**Vulnerability:** The registration endpoint (`POST /api/v1/auth/register`) allowed clients to specify the `role` field in the request body. An attacker could register themselves as an `admin` by including `"role": "admin"` in the payload.
**Learning:** Extracting all fields from `req.body` and passing them directly to a creation service without whitelisting or hardcoding sensitive fields like `role` leads to mass assignment vulnerabilities and privilege escalation.
**Prevention:** Always hardcode or whitelist sensitive fields in controllers. For registration, the role should be explicitly set to a default (e.g., `'user'`) regardless of what the client sends.
