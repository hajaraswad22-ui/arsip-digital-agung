-- Jalankan seluruh SQL ini di Supabase > SQL Editor > New query.
-- Tabel dokumen: setiap pengguna hanya dapat melihat/mengelola baris miliknya.
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  category text not null check (category in ('surat_tugas','sk','dokumentasi','data_diri','kerjasama','sertifikat','lainnya')),
  document_date date,
  description text,
  file_path text not null,
  file_name text not null,
  file_type text,
  file_size bigint,
  created_at timestamptz not null default now()
);

alter table public.documents enable row level security;

drop policy if exists "Users can view own documents" on public.documents;
create policy "Users can view own documents" on public.documents
for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own documents" on public.documents;
create policy "Users can insert own documents" on public.documents
for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can delete own documents" on public.documents;
create policy "Users can delete own documents" on public.documents
for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can update own documents" on public.documents;
create policy "Users can update own documents" on public.documents
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Bucket privat. File tidak memiliki URL publik.
insert into storage.buckets (id, name, public, file_size_limit)
values ('arsip-pribadi', 'arsip-pribadi', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;

drop policy if exists "Users can read own archive files" on storage.objects;
create policy "Users can read own archive files" on storage.objects
for select to authenticated using (
  bucket_id = 'arsip-pribadi' and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can upload own archive files" on storage.objects;
create policy "Users can upload own archive files" on storage.objects
for insert to authenticated with check (
  bucket_id = 'arsip-pribadi' and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete own archive files" on storage.objects;
create policy "Users can delete own archive files" on storage.objects
for delete to authenticated using (
  bucket_id = 'arsip-pribadi' and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update own archive files" on storage.objects;
create policy "Users can update own archive files" on storage.objects
for update to authenticated using (
  bucket_id = 'arsip-pribadi' and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'arsip-pribadi' and (storage.foldername(name))[1] = auth.uid()::text
);