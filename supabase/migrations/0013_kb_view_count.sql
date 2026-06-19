create or replace function increment_kb_view_count(article_id uuid)
returns void
language sql
as $$
  update kb_articles set view_count = view_count + 1 where id = article_id;
$$;
