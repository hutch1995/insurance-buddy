-- Add user preferences to profiles
alter table profiles
  add column if not exists interests text[] default '{}' not null,
  add column if not exists has_dependents boolean default false not null,
  add column if not exists onboarding_completed boolean default false not null;
