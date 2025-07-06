-- Enable pg_cron extension
create extension if not exists pg_cron;

-- Create stored procedure wrapper
create or replace function public.cron_daily_ingest()
returns void as $$
begin
  perform net.http_post(
    url := 'https://<your-deploy>/ingest/limitless',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('date', to_char(current_date, 'YYYY-MM-DD'))
  );
end;
$$ language plpgsql;

-- Schedule it for daily run
select cron.schedule('limitless_daily', '15 6 * * *', 'call cron_daily_ingest();');

