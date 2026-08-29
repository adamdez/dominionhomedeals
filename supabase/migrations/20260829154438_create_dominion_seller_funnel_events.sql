create table if not exists public.dominion_website_lead_receipts (
  id bigint generated always as identity primary key,
  flow text not null check (flow in ('website_general', 'seller_options_v1')),
  submission_id uuid unique,
  payload_fingerprint text check (
    payload_fingerprint is null or payload_fingerprint ~ '^[0-9a-f]{64}$'
  ),
  content text not null check (octet_length(content) <= 1048576),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    flow <> 'seller_options_v1' or
    (submission_id is not null and payload_fingerprint is not null)
  )
);

comment on table public.dominion_website_lead_receipts is
  'Private Dominion website lead receipts and delivery reconciliation. This table belongs in the Dominion Lazarus project, never the shared Al Boreland project.';

create index if not exists dominion_website_lead_receipts_flow_created_idx
  on public.dominion_website_lead_receipts (flow, created_at desc);

alter table public.dominion_website_lead_receipts enable row level security;

revoke all on table public.dominion_website_lead_receipts from anon, authenticated;
revoke all on sequence public.dominion_website_lead_receipts_id_seq from anon, authenticated;

create table if not exists public.dominion_seller_funnel_events (
  id bigint generated always as identity primary key,
  event_id uuid not null unique,
  visit_id uuid not null,
  event_type text not null check (event_type in (
    'landing_arrived',
    'page_engaged',
    'engaged_7s',
    'form_viewed',
    'form_focused',
    'input_started',
    'validation_failed',
    'step_completed',
    'submit_attempted',
    'submit_failed',
    'lead_accepted',
    'call_clicked',
    'page_exited',
    'conversion_reported',
    'conversion_failed'
  )),
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  page_path text not null check (page_path = '/sell/options'),
  stage text check (stage is null or stage in ('address', 'name', 'phone', 'details')),
  detail text check (detail is null or detail ~ '^[a-z0-9][a-z0-9_-]{0,63}$'),
  elapsed_ms integer check (elapsed_ms is null or elapsed_ms between 0 and 1800000),
  scroll_depth smallint check (scroll_depth is null or scroll_depth between 0 and 100),
  lead_receipt_id bigint,
  platform text not null check (platform in ('ios', 'android', 'desktop', 'unknown')),
  device_class text not null check (device_class in ('mobile', 'tablet', 'desktop', 'unknown')),
  viewport_bucket text not null check (viewport_bucket in ('small', 'medium', 'large', 'xlarge', 'unknown')),
  referrer_class text not null check (referrer_class in ('chatgpt', 'search', 'direct', 'other', 'unknown')),
  attribution jsonb not null default '{}'::jsonb check (jsonb_typeof(attribution) = 'object')
);

comment on table public.dominion_seller_funnel_events is
  'Privacy-minimal seller-options funnel events. Never store form values, raw user-agent strings, IP addresses, keystrokes, fingerprints, or session replay data.';

comment on column public.dominion_seller_funnel_events.attribution is
  'Allowlisted ad attribution only, including UTMs and opaque provider click references when present.';

create index if not exists dominion_seller_funnel_events_visit_time_idx
  on public.dominion_seller_funnel_events (visit_id, occurred_at);

create index if not exists dominion_seller_funnel_events_type_time_idx
  on public.dominion_seller_funnel_events (event_type, occurred_at desc);

create index if not exists dominion_seller_funnel_events_campaign_time_idx
  on public.dominion_seller_funnel_events ((attribution ->> 'utm_campaign'), occurred_at desc);

alter table public.dominion_seller_funnel_events enable row level security;

revoke all on table public.dominion_seller_funnel_events from anon, authenticated;
revoke all on sequence public.dominion_seller_funnel_events_id_seq from anon, authenticated;

create or replace view public.dominion_seller_funnel_visit_summary
with (security_invoker = true)
as
with visit_rollup as (
  select
    visit_id,
    min(occurred_at) as first_seen_at,
    max(occurred_at) as last_seen_at,
    coalesce(
      (array_agg(attribution order by occurred_at) filter (where attribution <> '{}'::jsonb))[1],
      '{}'::jsonb
    ) as attribution,
    coalesce(max(platform) filter (where platform <> 'unknown'), 'unknown') as platform,
    coalesce(max(device_class) filter (where device_class <> 'unknown'), 'unknown') as device_class,
    coalesce(max(viewport_bucket) filter (where viewport_bucket <> 'unknown'), 'unknown') as viewport_bucket,
    coalesce(max(referrer_class) filter (where referrer_class <> 'unknown'), 'unknown') as referrer_class,
    max(elapsed_ms) as max_elapsed_ms,
    max(scroll_depth) as max_scroll_depth,
    count(*) as event_count,
    count(*) filter (where event_type = 'validation_failed') as validation_failure_count,
    count(*) filter (where event_type = 'submit_attempted') as submit_attempt_count,
    count(*) filter (where event_type = 'submit_failed') as submit_failure_count,
    bool_or(event_type = 'page_engaged') as page_engaged,
    bool_or(event_type = 'engaged_7s') as engaged_7s,
    bool_or(event_type = 'form_viewed') as form_viewed,
    bool_or(event_type = 'form_focused') as form_focused,
    bool_or(event_type = 'input_started') as input_started,
    bool_or(event_type = 'call_clicked') as call_clicked,
    bool_or(event_type = 'lead_accepted') as lead_accepted,
    bool_or(event_type = 'conversion_reported') as conversion_reported,
    max(lead_receipt_id) as lead_receipt_id,
    max(case stage
      when 'address' then 1
      when 'name' then 2
      when 'phone' then 3
      when 'details' then 4
      else 0
    end) as highest_stage_rank
  from public.dominion_seller_funnel_events
  group by visit_id
)
select
  visit_id,
  first_seen_at,
  last_seen_at,
  attribution,
  platform,
  device_class,
  viewport_bucket,
  referrer_class,
  max_elapsed_ms,
  max_scroll_depth,
  event_count,
  validation_failure_count,
  submit_attempt_count,
  submit_failure_count,
  page_engaged,
  engaged_7s,
  form_viewed,
  form_focused,
  input_started,
  call_clicked,
  lead_accepted,
  conversion_reported,
  lead_receipt_id,
  case highest_stage_rank
    when 4 then 'details'
    when 3 then 'phone'
    when 2 then 'name'
    when 1 then 'address'
    else null
  end as highest_observed_stage,
  case
    when lead_accepted then 'accepted_lead'
    when submit_attempt_count > 0 then 'submit_not_accepted'
    when highest_stage_rank = 4 then 'left_during_details'
    when highest_stage_rank = 3 then 'left_during_phone'
    when highest_stage_rank = 2 then 'left_during_name'
    when input_started then 'left_during_address'
    when form_focused then 'focused_without_input'
    when form_viewed then 'viewed_form_without_focus'
    when engaged_7s or page_engaged then 'engaged_without_form_action'
    else 'no_recorded_engagement'
  end as last_proven_outcome
from visit_rollup;

comment on view public.dominion_seller_funnel_visit_summary is
  'Observed seller-options funnel outcomes by anonymous visit. The outcome is the last proven stage, not a claim about visitor intent or motivation.';

revoke all on table public.dominion_seller_funnel_visit_summary from anon, authenticated;
