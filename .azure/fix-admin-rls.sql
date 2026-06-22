-- Fix RLS for payment_proofs: allow admin to manage all + customers to insert their own
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Drop existing policies to recreate them
DROP POLICY IF EXISTS "Customers can insert their own proofs" ON public.payment_proofs;
DROP POLICY IF EXISTS "Customers can view their own proofs" ON public.payment_proofs;
DROP POLICY IF EXISTS "Admin can manage all proofs" ON public.payment_proofs;

-- 2. Customers can insert proofs for their own orders (including future orders)
CREATE POLICY "Customers can insert their own proofs" ON public.payment_proofs
  FOR INSERT
  WITH CHECK (
    customer_email = auth.email()
    OR
    auth.role() = 'service_role'
  );

-- 3. Customers can view their own proofs; admin can view all
CREATE POLICY "anyone can view proofs" ON public.payment_proofs
  FOR SELECT
  USING (
    customer_email = auth.email()
    OR
    auth.role() = 'service_role'
    OR
    auth.email() = 'salazaroliveros@gmail.com'
  );

-- 4. Admin and service_role can update any proof
CREATE POLICY "Admin can update proofs" ON public.payment_proofs
  FOR UPDATE
  USING (
    auth.role() = 'service_role'
    OR
    auth.email() = 'salazaroliveros@gmail.com'
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR
    auth.email() = 'salazaroliveros@gmail.com'
  );

-- 5. Only service_role can delete
CREATE POLICY "Only service can delete proofs" ON public.payment_proofs
  FOR DELETE
  USING (auth.role() = 'service_role');

-- 6. Allow admin to update order status (approve/reject)
DROP POLICY IF EXISTS "Admin can update orders" ON public.constructora_orders;
CREATE POLICY "Admin can update orders" ON public.constructora_orders
  FOR UPDATE
  USING (
    auth.role() = 'service_role'
    OR
    auth.email() = 'salazaroliveros@gmail.com'
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR
    auth.email() = 'salazaroliveros@gmail.com'
  );

-- 7. Allow customers to view their own orders
DROP POLICY IF EXISTS "Customers can view own orders" ON public.constructora_orders;
CREATE POLICY "Customers can view own orders" ON public.constructora_orders
  FOR SELECT
  USING (
    customer_email = auth.email()
    OR
    auth.role() = 'service_role'
    OR
    auth.email() = 'salazaroliveros@gmail.com'
  );

-- 8. Allow customers to insert orders (checkout flow)
DROP POLICY IF EXISTS "Customers can insert orders" ON public.constructora_orders;
CREATE POLICY "Customers can insert orders" ON public.constructora_orders
  FOR INSERT
  WITH CHECK (
    customer_email = auth.email()
    OR
    auth.role() = 'service_role'
    OR
    auth.email() = 'salazaroliveros@gmail.com'
  );
