-- CRUSH no longer collects or checks university/student eligibility.
-- The verification record table is empty at rollout, so remove obsolete fields.
alter table private.verification_records
  drop column if exists student_status,
  drop column if exists student_provider_ref;
