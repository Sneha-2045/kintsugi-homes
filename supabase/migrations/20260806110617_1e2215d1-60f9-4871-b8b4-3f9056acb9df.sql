CREATE POLICY "Admins manage property images" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'property-images' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'property-images' AND public.has_role(auth.uid(), 'admin'));