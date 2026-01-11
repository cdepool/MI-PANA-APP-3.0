# DATABASE HARDENING & RLS SECURITY PLAN
**Project:** MI PANA APP
**Version:** 1.0
**Author:** Antigravity (Senior Backend Security Engineer)

## 1. Vulnerability Analysis
Without strict Row Level Security (RLS) and data protection triggers, the following risks are present:

- **Identity Theft/Doxing:** Unauthorized access to `email` and `phone` columns in the `profiles` table.
- **Insecure Direct Object References (IDOR):** Any user could potentially view or modify `trips` and `payments` records by guessing or iterating over UUIDs.
- **Role Escalation:** Direct modification of `admin_role` or `role` within the `profiles` table via the frontend API.
- **Financial Integrity Risks:** Non-immutable payment records could be altered post-transaction, leading to reconciliation errors and fraud.

## 2. Security Logic & Policies

### 2.1 Profiles (`profiles`)
- **Read Logic:** 
    - Full record access: Restricted to the owner (`auth.uid() = id`).
    - Basic info access: Recommend using a database view (`public_profiles`) for `name` and `avatar_url` to prevent accidental exposure of `phone` and `email`.
- **Write Logic:** 
    - Restricted to the owner.
    - Protected columns (`admin_role`, `role`, `email`) are guarded by a `BEFORE UPDATE` trigger that blocks changes from the `authenticated` (frontend) role.

### 2.2 Trips (`trips`)
- **Read Logic:** `auth.uid() IN (passenger_id, driver_id)`. Ensures only parties involved in the ride can see the details.
- **Create Logic:** Restricted to authenticated users where `auth.uid() = passenger_id`.
- **Update Logic:** 
    - Drivers can update status (e.g., 'picked_up', 'completed').
    - Passengers can ONLY update (cancel) if the status is currently 'pending'.

### 2.3 Payments (`payments`)
- **Read Logic:** `auth.uid() IN (payer_id, payee_id)`.
- **Write Logic:** 
    - `INSERT`: Allowed for authenticated entities involved in the transaction.
    - `UPDATE/DELETE`: **STRICTLY PROHIBITED**. Records are immutable to ensure financial auditability.

## 3. Implementation Process
1. Backup existing policies using `pg_dump` or manual script.
2. Enable RLS on all tables.
3. Apply the `supabase_hardening_v1.sql` script.
4. Verify using the validation script.

## 4. Rollback Strategy
If legitimate application traffic is blocked:
1. Execute `DROP POLICY ...` commands for the affected tables.
2. In extreme cases, disable RLS temporarily: `ALTER TABLE <table_name> DISABLE ROW LEVEL SECURITY;`.
3. Review `access_logs` to identify the failing `qual` (policy condition).
