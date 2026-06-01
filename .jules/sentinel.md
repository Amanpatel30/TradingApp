## 2026-06-01 - [Privilege Escalation via Mass Assignment]
**Vulnerability:** New users could self-assign the 'admin' role during registration by including a `role` field in the request body.
**Learning:** The controller was destructuring the entire `req.body` and assigning a default value to `role` if not present, but it did not explicitly exclude or ignore the `role` field if it *was* present in the request.
**Prevention:** Always use explicit destructuring to extract only the required fields from user input (`req.body`, `req.query`, `req.params`) and avoid passing the entire object to services or database creators.
