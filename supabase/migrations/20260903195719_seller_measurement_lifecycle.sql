-- Applied before code release. Version matches the database migration ledger. No historical rewrite.
alter table public.dominion_seller_funnel_events
  add column active_visible_ms integer check (active_visible_ms between 0 and 1800000);

alter table public.dominion_seller_funnel_events
  drop constraint dominion_seller_funnel_events_event_type_check;
alter table public.dominion_seller_funnel_events
  add constraint dominion_seller_funnel_events_event_type_check check (event_type in (
    'landing_arrived','page_engaged','engaged_7s','form_viewed','form_focused',
    'input_started','validation_failed','step_completed','submit_attempted','submit_failed',
    'lead_accepted','call_clicked','page_exited','page_hidden','page_visible','page_restored',
    'conversion_reported','conversion_failed','conversion_validated','conversion_skipped','conversion_unknown'
  ));
comment on column public.dominion_seller_funnel_events.active_visible_ms is
  'Cumulative foreground-visible milliseconds since tracker mount. Not load time or proof of attention. NULL for historical rows.';
