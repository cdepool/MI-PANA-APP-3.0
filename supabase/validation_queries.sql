-- VALIDATION QUERIES FOR STEP 1.1
-- Run these queries in Supabase SQL Editor to verify security rules.

-- TEST GROUP 1: ANONYMOUS ACCESS CHECK
-- Expected Result: Empty array [] or Error 401 (if via API). In SQL Editor, simulates anon role.

BEGIN;
    -- 1.1 Try to read users as anon
    SET LOCAL ROLE anon;
    SELECT count(*) as "Anon Profile Access" FROM public.profiles;
    -- Should be 0 or count only PROFILES marked as public if any policy allows it (e.g. "Public profiles are viewable by everyone")
    -- Wait, we have "Public profiles are viewable by everyone" policy! 
    -- So this SHOULD return count. 
    -- Is this desired? Let's check the policy again.
    -- Policy: "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
    -- CONCLUSION: If this returns count, it is INTENDED but represents a privacy trade-off.
    
    -- 1.2 Try to read sensitive financial data as anon
    SET LOCAL ROLE anon;
    SELECT count(*) as "Anon Wallet Access" FROM public.wallets;
    -- EXPECTED: 0 / Access Denied.

    -- 1.3 Try to insert recharge request as anon
    SET LOCAL ROLE anon;
    INSERT INTO public.recharge_requests (wallet_id, user_id, amount_ves, bank_orig, last_four_digits, expires_at)
    VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 100, '0105', '1234', NOW())
    RETURNING *;
    -- EXPECTED: Error (RLS violations) or 0 rows affected.

ROLLBACK;


-- TEST GROUP 2: RLS ISOLATION (USER A vs USER B)
-- We simulate two users.

BEGIN;
    -- Setup: Cannot easily simulate auth.uid() mocking effectively in raw SQL console for specific UUIDs without extensions,
    -- but we can verify logic by inspecting policies directly or assuming 'authenticated' role with a specific ID.
    
    -- 2.1 Verify Policy Definitions exist
    SELECT tablename, policyname, cmd, qual, with_check 
    FROM pg_policies 
    WHERE tablename IN ('recharge_requests', 'bank_transactions', 'wallets');

    -- EXPECTED OUTPUT:
    -- recharge_requests | Users can view own recharge requests   | SELECT | (auth.uid() = user_id)
    -- bank_transactions | Users can view matched bank transactions| SELECT | (auth.uid() = matched_user_id)
    -- wallets           | Users can view their own wallet        | SELECT | (auth.uid() = user_id)

ROLLBACK;


-- TEST GROUP 3: INTEGRITY & IMMUTABILITY
-- Checking Triggers

BEGIN;
    -- 3.1 Check if update_updated_at trigger exists on financial tables
    SELECT event_object_table, trigger_name, action_timing, event_manipulation 
    FROM information_schema.triggers 
    WHERE event_object_table IN ('wallets', 'wallet_transactions');
    
ROLLBACK;
