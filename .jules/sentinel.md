## 2026-06-07 - Privilege Escalation via Registration

**Vulnerability:** The registration controller was extracting the `role` field directly from the `req.body` and passing it to the `authService.register` function, which then used a spread operator to create the user in MongoDB. This allowed malicious users to register as an 'admin' by providing `role: 'admin'` in the request body.

**Learning:** Even when a default value is provided (e.g., `const { role = 'user' } = req.body`), it does not prevent an attacker from explicitly overriding that value. Using a spread operator (`...userData`) on unsanitized input is a common pattern that leads to mass assignment vulnerabilities.

**Prevention:** Always explicitly define the fields being passed to service functions or database creation calls, especially for sensitive fields like 'role', 'permissions', or 'balance'. Hardcoding sensitive fields to their intended default value in the controller layer provides a strong defense against mass assignment.
