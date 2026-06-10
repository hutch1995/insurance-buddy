alter table profiles
  add column if not exists hidden_benefits jsonb default '[]'::jsonb not null;
