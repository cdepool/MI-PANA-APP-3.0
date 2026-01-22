-- SECURITY HARDENING PHASE 2
-- Goal: Enable RLS on sensitive financial tables and fix public access loopholes

-- 1. Enable RLS on recharge_requests
ALTER TABLE public.recharge_requests ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on bank_transactions
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

-- 3. Policies for recharge_requests
-- Users can only view their own recharge requests
CREATE POLICY "Users can view own recharge requests" ON public.recharge_requests
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own recharge requests (validated by Edge Function later for ownership)
CREATE POLICY "Users can insert own recharge requests" ON public.recharge_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only Service Role can update recharge requests (status changes)
-- Note: Edge Functions run with service role key usually, but if using auth context, might need explicit policy.
-- Assuming Edge Functions use Service Role for status updates.
-- If user needs to update anything (e.g. cancel), add specific policy.
-- For now, limiting updates to Service Role only to be safe.
-- (No policy for UPDATE means only Superuser/Service Role can update)

-- 4. Policies for bank_transactions
-- Users can view their own MATCHED transactions (once verified)
CREATE POLICY "Users can view matched bank transactions" ON public.bank_transactions
    FOR SELECT USING (auth.uid() = matched_user_id);

-- No INSERT/UPDATE policies for regular users on bank_transactions
-- All mutations must come from Edge Functions (Service Role) or Webhooks.

-- 5. Fix potential Profile hijacking
-- Revoke INSERT on profiles if it exists for public/anon?
-- (Already handled in previous migrations usually, but good to check)
-- Ensuring strict RLS on profiles update was part of previous phase.

-- 6. Grant necessary permissions
-- Ensure authenticated users can read their own data
GRANT SELECT ON public.recharge_requests TO authenticated;
GRANT SELECT ON public.bank_transactions TO authenticated;
GRANT INSERT ON public.recharge_requests TO authenticated;

-- 7. Backfill Wallets for existing users
-- Ensure every profile has a corresponding wallet record to prevent "Wallet not found" errors
INSERT INTO public.wallets (user_id, balance_ves, balance_usd, status)
SELECT id, 0, 0, 'active'
FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.wallets);
