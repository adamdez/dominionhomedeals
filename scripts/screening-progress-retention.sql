-- Approved first-pass diagnostic retention. Scope: new screening revisions only.
-- Legacy form history and actual seller/CRM records are not changed.
begin;
create extension if not exists pg_cron with schema pg_catalog;
create table if not exists public.dominion_screening_progress_daily (
  event_day date not null,
  revision text not null,
  campaign_id text not null default '',
  ad_id text not null default '',
  device_class text not null default 'unknown',
  event_type text not null,
  stage text not null default '',
  detail text not null default '',
  event_count bigint not null,
  primary key(event_day,revision,campaign_id,ad_id,device_class,event_type,stage,detail)
);
alter table public.dominion_screening_progress_daily enable row level security;
revoke all on public.dominion_screening_progress_daily from public,anon,authenticated;
grant select on public.dominion_screening_progress_daily to service_role;
create schema if not exists dominion_internal;
revoke all on schema dominion_internal from public,anon,authenticated;
create or replace function dominion_internal.retain_screening_progress()
returns void language sql security invoker set search_path='' as $function$
  with expired as (
    delete from public.dominion_meta_seller_funnel_events
    where received_at < now()-interval '30 days'
      and attribution->>'landing_revision'='screening_20261029_v2'
      and lead_receipt_id is null
      and event_type in ('landing_arrived','form_viewed','form_started','gate_answered','gate_exited','field_focused','validation_failed','submit_attempted','submit_failed','cta_clicked')
    returning occurred_at,received_at,event_type,stage,detail,attribution
  )
  insert into public.dominion_screening_progress_daily
    (event_day,revision,campaign_id,ad_id,device_class,event_type,stage,detail,event_count)
  select (coalesce(occurred_at,received_at) at time zone 'America/Los_Angeles')::date,
    attribution->>'landing_revision',coalesce(attribution->>'campaign_id',''),
    coalesce(attribution->>'ad_id',''),coalesce(attribution->>'device_class','unknown'),
    event_type,coalesce(stage,''),coalesce(detail,''),count(*)
  from expired group by 1,2,3,4,5,6,7,8
  on conflict(event_day,revision,campaign_id,ad_id,device_class,event_type,stage,detail)
  do update set event_count=public.dominion_screening_progress_daily.event_count+excluded.event_count;
  delete from public.dominion_meta_seller_funnel_events
    where received_at<now()-interval '30 days'
      and attribution->>'landing_revision'='screening_20261029_v2_qa'
      and lead_receipt_id is null
      and event_type in ('landing_arrived','form_viewed','form_started','gate_answered','gate_exited','field_focused','validation_failed','submit_attempted','submit_failed','cta_clicked');
$function$;
revoke all on function dominion_internal.retain_screening_progress() from public,anon,authenticated;
select cron.schedule('dominion-screening-progress-retention','15 8 * * *',
  $$select dominion_internal.retain_screening_progress();$$);
commit;
