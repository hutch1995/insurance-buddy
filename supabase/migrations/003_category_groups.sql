alter table benefit_categories
  add column if not exists category_group text,
  add column if not exists category_group_total numeric(10, 2);
