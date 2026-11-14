-- CRUSH PostgreSQL design reference. NOT connected to the mobile prototype.
-- Authentication credentials belong to a managed identity provider; never store plaintext
-- passwords here. `auth_subject` is the opaque subject ID returned by that provider.
-- A trusted API must authorize every read/write; schema constraints are not authorization.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE universities (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 name TEXT NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 160),
 country_code CHAR(2) NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE campuses (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 university_id UUID NOT NULL REFERENCES universities(id) ON DELETE RESTRICT,
 name TEXT NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 160),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE (university_id, name)
);
CREATE TABLE users (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 auth_subject TEXT NOT NULL UNIQUE CHECK (length(auth_subject) BETWEEN 1 AND 255),
 email_normalized TEXT NOT NULL UNIQUE CHECK (email_normalized = lower(btrim(email_normalized)) AND length(email_normalized) <= 320),
 account_status TEXT NOT NULL DEFAULT 'pending' CHECK (account_status IN ('pending','active','suspended','deleted')),
 age_verified_at TIMESTAMPTZ,
 student_verified_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE profiles (
 user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 display_name TEXT NOT NULL CHECK (length(btrim(display_name)) BETWEEN 1 AND 40),
 bio TEXT CHECK (bio IS NULL OR length(bio) <= 500),
 campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
 visibility TEXT NOT NULL DEFAULT 'visible' CHECK (visibility IN ('visible','hidden')),
 dating_enabled BOOLEAN NOT NULL DEFAULT true,
 friendship_enabled BOOLEAN NOT NULL DEFAULT true,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE blocks (
 blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY (blocker_id, blocked_id),
 CHECK (blocker_id <> blocked_id)
);
CREATE INDEX blocks_reverse_lookup ON blocks (blocked_id, blocker_id);
CREATE TABLE secret_crushes (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE (sender_id, recipient_id),
 CHECK (sender_id <> recipient_id)
);
CREATE INDEX secret_crush_recipient_idx ON secret_crushes (recipient_id, created_at DESC);
-- Never expose sender_id for unmatched rows; reveal only after verified mutual match.
CREATE TABLE matches (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 user_low UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 user_high UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE (user_low, user_high),
 CHECK (user_low < user_high)
);
CREATE TABLE conversations (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 match_id UUID NOT NULL UNIQUE REFERENCES matches(id) ON DELETE CASCADE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE messages (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
 sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 body TEXT NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 5000),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX messages_conversation_time_idx ON messages (conversation_id, created_at DESC, id DESC);
CREATE TABLE reports (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
 category TEXT NOT NULL CHECK (category IN ('harassment','impersonation','underage','spam','unsafe_content','other')),
 details TEXT CHECK (details IS NULL OR length(details) <= 4000),
 status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','actioned','dismissed')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK (target_user_id IS NULL OR reporter_id <> target_user_id)
);
CREATE INDEX reports_queue_idx ON reports (status, created_at) WHERE status IN ('pending','reviewing');

-- Production prerequisites (must be implemented and tested before launch):
-- * API-owned DB role is non-owner, non-superuser, has no BYPASSRLS, and has least privilege.
-- * Apply provider-specific RLS policies or enforce authorization in every trusted API query.
--   Do not enable RLS without usable policies: it can silently break service behavior.
-- * Message authorization must check conversation membership, active match, and both block directions.
-- * Secret-crush reads must never reveal sender_id unless mutual-match authorization succeeds.
-- * Set transaction-local user context only from verified server-side auth; never accept it from clients.
-- * Add audited migrations, backups, retention/deletion jobs, encryption-at-rest, TLS, and secret rotation.
