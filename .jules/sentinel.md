# Sentinel Journal - Critical Security Learnings

## 2025-05-15 - [Privilege Escalation via Mass Assignment]
**Vulnerability:** User registration allowed the `role` field to be passed in the request body, enabling any user to register as an 'admin'.
**Learning:** Defaulting values in an object spread or destructuring without filtering `req.body` is insufficient if the client can provide those keys.
**Prevention:** Always explicitly pick allowed fields from user input or use a strict validation schema that strips unknown fields before passing them to the database or service layer.
