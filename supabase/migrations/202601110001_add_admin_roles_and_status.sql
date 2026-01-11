-- Migration: add_admin_roles_and_status_to_profiles
-- Created: 2026-01-11
-- Description: Adds adminRole and status columns to profiles table to support granular admin roles and user management.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS "adminRole" text,
ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active';

COMMENT ON COLUMN public.profiles."adminRole" IS 'Sub-rol administrativo (SUPER_ADMIN, SUPPORT, etc)';
COMMENT ON COLUMN public.profiles."status" IS 'Estado de cuenta del usuario (active, suspended)';
