# Security Specification: Vendhan Hire Candidate Portal

## Data Invariants
1.  **Applicants**:
    *   Public can only CREATE an applicant record.
    *   Once created, public cannot READ or UPDATE the record (to protect PII).
    *   `fullName`, `email`, `role`, `resumeUrl` are required.
    *   `status` must default to `applied`.
    *   `createdAt` and `updatedAt` must be set to `request.time`.
    *   Only admins can `list`, `get`, `update`, or `delete` applicants.
2.  **Jobs**:
    *   Anyone can `list` and `get` active jobs.
    *   Only admins can `create`, `update`, or `delete` jobs.
3.  **Admins**:
    *   Admin status is determined by being in the `/admins/` collection.

## Dirty Dozen Payloads (Rejections)
1.  **Identity Spoofing**: Public user trying to `list` all applicants.
2.  **PII Leak**: Public user trying to `get` an applicant by ID.
3.  **Unauthorized Status Change**: Public user trying to set status to `hired` during creation.
4.  **Shadow Fields**: Public user trying to inject secret fields like `internalRating`.
5.  **Role Escalation**: Public user trying to create a document in `/admins/`.
6.  **Immutable Tampering**: Admin trying to change `createdAt` on an applicant.
7.  **Resource Exhaustion**: Public user sending a 1MB string as `fullName`.
8.  **ID Poisoning**: Public user using a 2KB junk string as document ID.
9.  **Orphaned Applicant**: Public user applying for a `jobId` that doesn't exist. (Relational check)
10. **Admin Bypass**: User with a spoofed custom claim trying to access admin routes (not using token claims, but DB lookup).
11. **Update Gap**: Admin updating `status` without updating `updatedAt`.
12. **Null Pointer**: Admin reading a field before it exists (e.g. `interviewRemarks`).

## Test Requirements
- `create` applicant (public) -> ALLOW (with valid schema)
- `get` applicant (public) -> DENY
- `list` applicants (public) -> DENY
- `update` applicant status (public) -> DENY
- `list` applicants (admin) -> ALLOW
- `update` applicant remarks (admin) -> ALLOW
- `create` job (public) -> DENY
- `create` job (admin) -> ALLOW
