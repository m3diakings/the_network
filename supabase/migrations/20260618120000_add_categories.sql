-- Additional trade categories beyond the original four seeded in
-- 20250505120000_initial_schema.sql. Idempotent: on conflict (slug) do nothing.
--
-- general-contractor was previously added directly in the hosted DB; it is
-- included here so a fresh `supabase db reset` reproduces the live category set.

insert into public.categories (slug, name, description, icon_key, sort_order) values
  ('general-contractor', 'General Contractor', 'New builds, additions, and whole-home renovation management.', 'i-lucide-hard-hat', 5),
  ('code-compliance-permit-expediting', 'Code Compliance & Permit Expediting', 'Permit pulling, plan review, and building-code compliance for Florida construction projects.', 'i-lucide-file-check', 6)
on conflict (slug) do nothing;
