## 2026-05-23 - Privilege Escalation in User Registration
**Vulnerability:** The registration endpoint allowed clients to specify a 'role' in the request body, potentially allowing an attacker to register as an 'admin'.
**Learning:** Destructuring request bodies without explicit filtering or hardcoding sensitive fields can lead to privilege escalation.
**Prevention:** Always hardcode default roles in registration controllers or use strict input validation/sanitization to prevent overriding sensitive fields.
