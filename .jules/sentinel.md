## 2026-05-30 - Privilege Escalation via Mass Assignment in Registration

**Vulnerability:** The registration endpoint (`/api/v1/auth/register`) allowed users to specify their `role` in the request body. By sending `{"role": "admin"}`, any new user could gain administrative privileges.

**Learning:** Destructuring `req.body` directly into service calls without strict allow-listing or hardcoded defaults for sensitive fields like `role` or `permissions` creates a mass assignment vulnerability. The application also lacked global input validation schemas for the authentication module.

**Prevention:**
1. Always hardcode sensitive fields (like `role`) to their safest default values in public-facing controllers.
2. Implement strict input validation using schemas (e.g., Zod) that only allow expected fields to pass through to the business logic.
3. Use a `validateRequest` middleware to sanitize and validate all incoming data against these schemas.
