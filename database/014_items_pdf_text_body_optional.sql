-- 014_items_pdf_text_body_optional.sql
-- Allow optional non-empty text_body for PDF items while keeping required pdf storage_path.
-- Execute manually in Supabase SQL Editor.

-- Optional diagnostics before applying:
-- select
--   conname,
--   pg_get_constraintdef(c.oid) as definition,
--   c.convalidated
-- from pg_constraint c
-- join pg_class t on t.oid = c.conrelid
-- join pg_namespace n on n.oid = t.relnamespace
-- where n.nspname = 'public'
--   and t.relname = 'items'
--   and c.contype = 'c'
-- order by conname;

alter table public.items
drop constraint if exists items_content_chk;

alter table public.items
add constraint items_content_chk check (
  (
    type = 'pdf'
    and storage_path is not null
    and nullif(trim(storage_path), '') is not null
    and storage_path like 'pdf/%'
    and (
      text_body is null
      or nullif(trim(text_body), '') is not null
    )
  )
  or
  (
    type = 'audio'
    and storage_path is not null
    and nullif(trim(storage_path), '') is not null
    and storage_path like 'audio/%'
  )
  or
  (
    type = 'image'
    and storage_path is not null
    and nullif(trim(storage_path), '') is not null
    and storage_path like 'image/%'
    and (
      text_body is null
      or nullif(trim(text_body), '') is not null
    )
  )
  or
  (
    type = 'text'
    and text_body is not null
    and nullif(trim(text_body), '') is not null
    and (
      storage_path is null
      or (
        nullif(trim(storage_path), '') is not null
        and storage_path like 'image/%'
      )
    )
  )
  or
  (
    type = 'video'
  )
) not valid;

-- Optional cleanup to avoid validation failures from whitespace-only text_body in PDF rows.
update public.items
set text_body = null
where type = 'pdf'
  and text_body is not null
  and nullif(trim(text_body), '') is null;

alter table public.items
validate constraint items_content_chk;
