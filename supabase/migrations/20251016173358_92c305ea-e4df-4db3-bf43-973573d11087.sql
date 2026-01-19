-- Add invoice_user role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'invoice_user';