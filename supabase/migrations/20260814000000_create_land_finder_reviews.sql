create table if not exists public.lazarus_land_finder_reviews (
  parcel_id text primary key,
  favorite boolean not null default false,
  review_state text not null default 'unreviewed'
    check (review_state in ('unreviewed', 'maybe', 'pass')),
  called_at timestamptz,
  letter_sent_at timestamptz,
  notes text not null default '' check (char_length(notes) <= 5000),
  listing_status text not null default 'unknown'
    check (listing_status in ('unknown', 'listed', 'not_listed')),
  listing_verified_at timestamptz,
  listing_source_url text check (listing_source_url is null or char_length(listing_source_url) <= 1000),
  distress_status text not null default 'unknown'
    check (distress_status in ('unknown', 'evidence', 'none')),
  distress_verified_at timestamptz,
  distress_source_url text check (distress_source_url is null or char_length(distress_source_url) <= 1000),
  updated_by text not null default 'Team' check (char_length(updated_by) between 1 and 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lazarus_land_finder_reviews_parcel_id_format check (parcel_id ~ '^\d{5}\.\d{4}$')
);

comment on table public.lazarus_land_finder_reviews is
  'Shared review state for the private Spokane County Land Finder. Parcel owner PII is intentionally excluded.';

alter table public.lazarus_land_finder_reviews enable row level security;

revoke all on table public.lazarus_land_finder_reviews from anon, authenticated;
grant select, insert, update, delete on table public.lazarus_land_finder_reviews to service_role;
