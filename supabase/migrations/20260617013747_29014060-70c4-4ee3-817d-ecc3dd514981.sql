
-- Fix mutable search_path on revenue_band
CREATE OR REPLACE FUNCTION public.revenue_band(_revenue numeric)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  select case
    when _revenue is null or _revenue <= 0 then null
    when _revenue < 500000 then 'Under $500K'
    when _revenue < 1000000 then '$500K - $1M'
    when _revenue < 2500000 then '$1M - $2.5M'
    when _revenue < 5000000 then '$2.5M - $5M'
    when _revenue < 10000000 then '$5M - $10M'
    else '$10M+'
  end
$$;

-- Add UPDATE policy on storage.objects for data-room mirroring INSERT
CREATE POLICY "owners update own data room"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'data-room' AND public.user_owns_business_path(name))
WITH CHECK (bucket_id = 'data-room' AND public.user_owns_business_path(name));

-- Add DELETE policy for owners on buyer_access_requests
CREATE POLICY "owners can delete buyer access requests"
ON public.buyer_access_requests FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = buyer_access_requests.business_id AND b.owner_id = auth.uid()));
