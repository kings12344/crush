-- CRUSH product-domain schema draft (additive to database/schema.sql).
-- Review and test with a migration runner before applying to any database.
-- This migration adds data structures only; it does NOT implement API authorization,
-- RLS policies, provider integrations, moderation operations, or production security.
-- Never store raw identity documents, provider secrets, or payment-card data here.
BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS friendship_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS pronouns TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  min_age SMALLINT CHECK (min_age IS NULL OR min_age BETWEEN 18 AND 120),
  max_age SMALLINT CHECK (max_age IS NULL OR max_age BETWEEN 18 AND 120),
  preferred_campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
  read_receipts_enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (min_age IS NULL OR max_age IS NULL OR min_age <= max_age)
);

CREATE TABLE IF NOT EXISTS interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE CHECK (length(btrim(name)) BETWEEN 1 AND 48),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profile_interests (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, interest_id)
);
CREATE INDEX IF NOT EXISTS profile_interests_interest_idx ON profile_interests (interest_id, user_id);

CREATE TABLE IF NOT EXISTS profile_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (length(btrim(provider)) BETWEEN 1 AND 64),
  provider_asset_id TEXT NOT NULL CHECK (length(provider_asset_id) BETWEEN 1 AND 512),
  media_kind TEXT NOT NULL CHECK (media_kind IN ('photo','video')),
  moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending','approved','rejected','review')),
  display_order SMALLINT NOT NULL DEFAULT 0 CHECK (display_order BETWEEN 0 AND 30),
  is_profile_photo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_asset_id)
);
CREATE INDEX IF NOT EXISTS profile_media_user_status_idx ON profile_media (user_id, moderation_status, display_order);

CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  connection_mode TEXT NOT NULL CHECK (connection_mode IN ('dating','friendship')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sender_id, recipient_id, connection_mode),
  CHECK (sender_id <> recipient_id)
);
CREATE INDEX IF NOT EXISTS likes_recipient_time_idx ON likes (recipient_id, created_at DESC);

CREATE TABLE IF NOT EXISTS unmatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (match_id)
);

CREATE TABLE IF NOT EXISTS verification_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verification_kind TEXT NOT NULL CHECK (verification_kind IN ('age','student')),
  provider TEXT,
  provider_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_review','verified','rejected','expired','cancelled')),
  minimum_age_met BOOLEAN,
  reviewer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (minimum_age_met IS NULL OR verification_kind = 'age')
);
CREATE INDEX IF NOT EXISTS verification_cases_queue_idx ON verification_cases (status, verification_kind, created_at);
CREATE INDEX IF NOT EXISTS verification_cases_user_idx ON verification_cases (user_id, verification_kind, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS verification_provider_reference_uq
  ON verification_cases (provider, provider_reference)
  WHERE provider IS NOT NULL AND provider_reference IS NOT NULL;

CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followed_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followed_id),
  CHECK (follower_id <> followed_id)
);
CREATE INDEX IF NOT EXISTS follows_followed_idx ON follows (followed_id, created_at DESC);

CREATE TABLE IF NOT EXISTS video_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (length(btrim(provider)) BETWEEN 1 AND 64),
  provider_asset_id TEXT NOT NULL CHECK (length(provider_asset_id) BETWEEN 1 AND 512),
  caption TEXT CHECK (caption IS NULL OR length(caption) <= 1000),
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending','processing','ready','failed','removed')),
  moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending','approved','rejected','review')),
  visibility TEXT NOT NULL DEFAULT 'campus' CHECK (visibility IN ('campus','matches','private')),
  duration_ms INTEGER CHECK (duration_ms IS NULL OR duration_ms BETWEEN 1 AND 180000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_asset_id)
);
CREATE INDEX IF NOT EXISTS video_posts_feed_idx ON video_posts (moderation_status, processing_status, created_at DESC);
CREATE INDEX IF NOT EXISTS video_posts_user_idx ON video_posts (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS video_likes (
  video_id UUID NOT NULL REFERENCES video_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (video_id, user_id)
);
CREATE INDEX IF NOT EXISTS video_likes_user_idx ON video_likes (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS video_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES video_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 2000),
  moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending','approved','rejected','review')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS video_comments_video_time_idx ON video_comments (video_id, created_at DESC);

CREATE TABLE IF NOT EXISTS campus_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE RESTRICT,
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title TEXT NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 160),
  description TEXT CHECK (description IS NULL OR length(description) <= 4000),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  capacity INTEGER CHECK (capacity IS NULL OR capacity BETWEEN 1 AND 100000),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','cancelled','completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS campus_events_listing_idx ON campus_events (campus_id, status, starts_at);

CREATE TABLE IF NOT EXISTS event_registrations (
  event_id UUID NOT NULL REFERENCES campus_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered','waitlisted','cancelled','attended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);
CREATE INDEX IF NOT EXISTS event_registrations_user_idx ON event_registrations (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE RESTRICT,
  caller_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  callee_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  provider TEXT NOT NULL CHECK (length(btrim(provider)) BETWEEN 1 AND 64),
  provider_room_id TEXT NOT NULL CHECK (length(provider_room_id) BETWEEN 1 AND 512),
  call_kind TEXT NOT NULL CHECK (call_kind IN ('audio','video')),
  status TEXT NOT NULL DEFAULT 'ringing' CHECK (status IN ('ringing','accepted','declined','ended','missed','cancelled')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (caller_id <> callee_id),
  CHECK (ended_at IS NULL OR started_at IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS calls_match_time_idx ON calls (match_id, created_at DESC);

CREATE TABLE IF NOT EXISTS push_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('expo','apns','fcm')),
  token_hash TEXT NOT NULL CHECK (length(token_hash) BETWEEN 32 AND 256),
  token_ciphertext BYTEA NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios','android')),
  active BOOLEAN NOT NULL DEFAULT true,
  last_registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, token_hash)
);
CREATE INDEX IF NOT EXISTS push_devices_user_active_idx ON push_devices (user_id, active);
COMMENT ON COLUMN push_devices.token_ciphertext IS
  'Application-encrypted device token; decrypt only in the trusted notification worker.';

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (length(btrim(kind)) BETWEEN 1 AND 64),
  title TEXT NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 160),
  body TEXT CHECK (body IS NULL OR length(body) <= 500),
  resource_type TEXT,
  resource_id UUID,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON notifications (user_id, created_at DESC) WHERE read_at IS NULL;

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (length(btrim(provider)) BETWEEN 1 AND 64),
  provider_subscription_id TEXT NOT NULL CHECK (length(provider_subscription_id) BETWEEN 1 AND 512),
  tier TEXT NOT NULL CHECK (length(btrim(tier)) BETWEEN 1 AND 64),
  status TEXT NOT NULL CHECK (status IN ('trialing','active','past_due','cancelled','expired')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_subscription_id)
);
CREATE INDEX IF NOT EXISTS subscriptions_user_status_idx ON subscriptions (user_id, status);

CREATE TABLE IF NOT EXISTS payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (length(btrim(provider)) BETWEEN 1 AND 64),
  provider_event_id TEXT NOT NULL CHECK (length(provider_event_id) BETWEEN 1 AND 512),
  event_type TEXT NOT NULL CHECK (length(btrim(event_type)) BETWEEN 1 AND 128),
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending','processed','failed','ignored')),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  UNIQUE (provider, provider_event_id)
);
CREATE INDEX IF NOT EXISTS payment_events_pending_idx ON payment_events (received_at) WHERE processing_status = 'pending';

CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('no_action','content_removed','warning','temporary_suspension','permanent_suspension','escalated')),
  reason_code TEXT NOT NULL CHECK (length(btrim(reason_code)) BETWEEN 1 AND 64),
  notes TEXT CHECK (notes IS NULL OR length(notes) <= 4000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS moderation_actions_target_idx ON moderation_actions (target_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user','staff','system','provider')),
  action TEXT NOT NULL CHECK (length(btrim(action)) BETWEEN 1 AND 128),
  resource_type TEXT NOT NULL CHECK (length(btrim(resource_type)) BETWEEN 1 AND 64),
  resource_id UUID,
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_resource_idx ON audit_logs (resource_type, resource_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON audit_logs (actor_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS data_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_kind TEXT NOT NULL CHECK (request_kind IN ('export','deletion')),
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','processing','completed','rejected','cancelled')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS data_requests_queue_idx ON data_requests (status, requested_at);

CREATE TABLE IF NOT EXISTS staff_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('moderator','support','privacy_officer','billing_admin','super_admin')),
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role)
);
CREATE INDEX IF NOT EXISTS staff_roles_role_idx ON staff_roles (role, user_id);

-- Deliberately no generic RLS is enabled here. Add provider-specific policies only after
-- identifying the verified auth subject and proving that every app/API query has correct scope.
-- Sensitive operations require transactions and trusted API checks for:
-- * active, age-eligible, student-eligible account status;
-- * mutual-match and conversation membership;
-- * both directions of blocking and match revocation;
-- * mutually reciprocated Secret Crush before any sender identity is returned;
-- * media ownership, moderation state, visibility, and short-lived signed provider access;
-- * moderator roles, audited case access, and deletion/export retention rules.
COMMIT;
