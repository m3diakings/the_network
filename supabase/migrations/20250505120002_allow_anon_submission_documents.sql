-- Public submission flow: allow anon uploads of license/insurance documents
-- only under the "submissions/" path prefix. Reads stay restricted to the
-- existing authenticated/admin policies.

create policy "Anyone can upload submission documents"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'business-documents'
    and (storage.foldername(name))[1] = 'submissions'
  );
