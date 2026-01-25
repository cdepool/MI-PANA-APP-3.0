-- USER CONSOLIDATION SCRIPT
-- Goal: Merge specific duplicates and delete test accounts

BEGIN;

-- 1. Group: Hermann Ebener
-- Main: 28ab252c-895e-4002-aee1-2826eda5bdf7
-- Duplicates: 3bbf011c-eeb0-4b26-8fac-e0324a5859e8, e6edf5ff-503d-4269-ba54-1a59b3ed6e3b

UPDATE public.trips SET passenger_id = '28ab252c-895e-4002-aee1-2826eda5bdf7' WHERE passenger_id IN ('3bbf011c-eeb0-4b26-8fac-e0324a5859e8', 'e6edf5ff-503d-4269-ba54-1a59b3ed6e3b');
UPDATE public.trips SET driver_id = '28ab252c-895e-4002-aee1-2826eda5bdf7' WHERE driver_id IN ('3bbf011c-eeb0-4b26-8fac-e0324a5859e8', 'e6edf5ff-503d-4269-ba54-1a59b3ed6e3b');
UPDATE public.wallet_transactions SET user_id = '28ab252c-895e-4002-aee1-2826eda5bdf7' WHERE user_id IN ('3bbf011c-eeb0-4b26-8fac-e0324a5859e8', 'e6edf5ff-503d-4269-ba54-1a59b3ed6e3b');
UPDATE public.recharge_requests SET user_id = '28ab252c-895e-4002-aee1-2826eda5bdf7' WHERE user_id IN ('3bbf011c-eeb0-4b26-8fac-e0324a5859e8', 'e6edf5ff-503d-4269-ba54-1a59b3ed6e3b');

-- 2. Group: Carlos Depool / Next TV
-- Main: a677997c-dfae-41cf-b2c2-04986105f202
-- Duplicates: 8754bd10-d56e-494c-8f61-9acec9cce14b, a5726ea2-92aa-47bb-a7a5-f58e334f4ac6

UPDATE public.trips SET passenger_id = 'a677997c-dfae-41cf-b2c2-04986105f202' WHERE passenger_id IN ('8754bd10-d56e-494c-8f61-9acec9cce14b', 'a5726ea2-92aa-47bb-a7a5-f58e334f4ac6');
UPDATE public.trips SET driver_id = 'a677997c-dfae-41cf-b2c2-04986105f202' WHERE driver_id IN ('8754bd10-d56e-494c-8f61-9acec9cce14b', 'a5726ea2-92aa-47bb-a7a5-f58e334f4ac6');
UPDATE public.wallet_transactions SET user_id = 'a677997c-dfae-41cf-b2c2-04986105f202' WHERE user_id IN ('8754bd10-d56e-494c-8f61-9acec9cce14b', 'a5726ea2-92aa-47bb-a7a5-f58e334f4ac6');
UPDATE public.recharge_requests SET user_id = 'a677997c-dfae-41cf-b2c2-04986105f202' WHERE user_id IN ('8754bd10-d56e-494c-8f61-9acec9cce14b', 'a5726ea2-92aa-47bb-a7a5-f58e334f4ac6');

-- 3. Group: Test Users (04121234567)
-- Action: Pure deletion as requested

DELETE FROM public.trips WHERE passenger_id IN ('62688fb2-6512-4568-836e-41c4a1f65952', '1de0c036-4793-4785-ae88-75207f467e10', '9b1eed3a-e7fb-44cf-9c2f-ba00498798c4', '4976de77-13ee-47ff-8ec5-86af37dd6834');
DELETE FROM public.trips WHERE driver_id IN ('62688fb2-6512-4568-836e-41c4a1f65952', '1de0c036-4793-4785-ae88-75207f467e10', '9b1eed3a-e7fb-44cf-9c2f-ba00498798c4', '4976de77-13ee-47ff-8ec5-86af37dd6834');
DELETE FROM public.wallet_transactions WHERE user_id IN ('62688fb2-6512-4568-836e-41c4a1f65952', '1de0c036-4793-4785-ae88-75207f467e10', '9b1eed3a-e7fb-44cf-9c2f-ba00498798c4', '4976de77-13ee-47ff-8ec5-86af37dd6834');
DELETE FROM public.recharge_requests WHERE user_id IN ('62688fb2-6512-4568-836e-41c4a1f65952', '1de0c036-4793-4785-ae88-75207f467e10', '9b1eed3a-e7fb-44cf-9c2f-ba00498798c4', '4976de77-13ee-47ff-8ec5-86af37dd6834');
DELETE FROM public.wallets WHERE user_id IN ('62688fb2-6512-4568-836e-41c4a1f65952', '1de0c036-4793-4785-ae88-75207f467e10', '9b1eed3a-e7fb-44cf-9c2f-ba00498798c4', '4976de77-13ee-47ff-8ec5-86af37dd6834');

-- Final Cleanup of duplicate/unwanted profiles
DELETE FROM public.profiles WHERE id IN (
  '3bbf011c-eeb0-4b26-8fac-e0324a5859e8', -- Hermann Duplicate 1
  'e6edf5ff-503d-4269-ba54-1a59b3ed6e3b', -- Hermann Duplicate 2
  '8754bd10-d56e-494c-8f61-9acec9cce14b', -- Carlos Duplicate 1
  'a5726ea2-92aa-47bb-a7a5-f58e334f4ac6', -- Carlos Duplicate 2
  '62688fb2-6512-4568-836e-41c4a1f65952', -- Test Main
  '1de0c036-4793-4785-ae88-75207f467e10', -- Test Duplicate 1
  '9b1eed3a-e7fb-44cf-9c2f-ba00498798c4', -- Test Duplicate 2
  '4976de77-13ee-47ff-8ec5-86af37dd6834'  -- Test Duplicate 3
);

COMMIT;
