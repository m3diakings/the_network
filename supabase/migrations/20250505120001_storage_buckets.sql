-- Storage for business logos (public URLs) and license/insurance PDFs (private).
-- Guest uploads without auth: use a server route or Edge Function with the service role,
-- or sign users in before upload. Anonymous direct uploads to private buckets are not enabled.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'business-logos',
    'business-logos',
    true,
    5242880,
    array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
  ),
  (
    'business-documents',
    'business-documents',
    false,
    10485760,
    array['application/pdf', 'image/png', 'image/jpeg']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- business-logos (public read)
-- ---------------------------------------------------------------------------
create policy "Public read business logos"
  on storage.objects for select
  to public
  using (bucket_id = 'business-logos');

create policy "Anyone can upload business logos"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'business-logos');

create policy "Users can update own logo uploads"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'business-logos' and owner = auth.uid())
  with check (bucket_id = 'business-logos' and owner = auth.uid());

create policy "Users can delete own logo uploads"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'business-logos' and owner = auth.uid());

-- ---------------------------------------------------------------------------
-- business-documents (private; path prefix = auth user id, e.g. "<uid>/license.pdf")
-- ---------------------------------------------------------------------------
create policy "Users can upload own business documents"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'business-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read own business documents"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'business-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own business documents"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'business-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'business-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own business documents"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'business-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Admins can read all business documents"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'business-documents'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );
