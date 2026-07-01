
-- Xero connections: mirror quickbooks_connections
CREATE POLICY "users insert own xero connections"
  ON public.xero_connections FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users update own xero connections"
  ON public.xero_connections FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "users delete own xero connections"
  ON public.xero_connections FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Buyer access request events: block all client writes.
-- Inserts happen exclusively via SECURITY DEFINER functions
-- (submit_buyer_access_request, update_buyer_access_request_status).
CREATE POLICY "no client inserts on buyer access request events"
  ON public.buyer_access_request_events AS RESTRICTIVE
  FOR INSERT TO authenticated, anon
  WITH CHECK (false);

CREATE POLICY "no client updates on buyer access request events"
  ON public.buyer_access_request_events AS RESTRICTIVE
  FOR UPDATE TO authenticated, anon
  USING (false) WITH CHECK (false);

CREATE POLICY "no client deletes on buyer access request events"
  ON public.buyer_access_request_events AS RESTRICTIVE
  FOR DELETE TO authenticated, anon
  USING (false);
