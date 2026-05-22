## 2026-05-22 - Missing Logging Redaction and Privilege Escalation Protection
**Vulnerability:** Sensitive fields (passwords, tokens) were being logged in plain text in the central error handler. Additionally, the registration endpoint allowed clients to specify their own 'role', enabling potential privilege escalation to 'admin'.
**Learning:** The codebase lacked a centralized utility for data masking, and input validation for critical fields like 'role' was not strictly enforced at the controller level despite architectural assumptions.
**Prevention:** Implement a centralized masking utility for all logging and strictly control sensitive fields during user creation/update processes.
