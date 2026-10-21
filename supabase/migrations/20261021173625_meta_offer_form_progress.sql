-- Add progress milestones without changing existing events, rows, RLS or grants.
SET lock_timeout = '5s';
ALTER TABLE public.dominion_meta_seller_funnel_events
  DROP CONSTRAINT dominion_meta_seller_funnel_events_event_type_check,
  ADD CONSTRAINT dominion_meta_seller_funnel_events_event_type_check CHECK (event_type IN (
    'landing_arrived','gate_answered','gate_exited','validation_failed',
    'submit_attempted','submit_failed','lead_accepted',
    'form_viewed','form_started','field_completed','field_focused','form_ready','cta_clicked'
  ));
