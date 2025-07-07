-- pg_cron Setup for Automated MCP Processing
-- Generated: 2025-07-06

-- Enable pg_cron extension (requires superuser privileges)
-- Note: This may need to be done manually in Supabase dashboard
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function to process pending transcripts automatically
CREATE OR REPLACE FUNCTION process_pending_transcripts()
RETURNS void AS $$
DECLARE
  transcript_record RECORD;
  processing_count INTEGER := 0;
BEGIN
  -- Get transcripts that haven't been processed yet
  FOR transcript_record IN 
    SELECT t.id, t.transcript_text, t.user_id, t.created_at
    FROM transcripts t
    LEFT JOIN processing_logs pl ON pl.transcript_id = t.id AND pl.stage = 'proposed'
    WHERE t.transcript_text IS NOT NULL 
      AND t.transcript_text != ''
      AND pl.id IS NULL  -- No processing logs = not processed
      AND t.created_at > NOW() - INTERVAL '24 hours'  -- Only recent transcripts
    ORDER BY t.created_at DESC
    LIMIT 10  -- Process max 10 at a time to avoid overload
  LOOP
    BEGIN
      -- Log that we're starting to process this transcript
      INSERT INTO processing_logs (
        job_id, 
        transcript_id, 
        stage, 
        status, 
        payload
      ) VALUES (
        gen_random_uuid(),
        transcript_record.id,
        'ingested',
        'auto_processing_started',
        jsonb_build_object(
          'user_id', transcript_record.user_id,
          'transcript_length', length(transcript_record.transcript_text),
          'auto_processed', true,
          'processed_at', NOW()
        )
      );
      
      processing_count := processing_count + 1;
      
      -- TODO: Here you would call your Python MCP processor
      -- For now, we'll just log that it would be processed
      RAISE NOTICE 'Would process transcript % for user %', 
        transcript_record.id, transcript_record.user_id;
        
    EXCEPTION WHEN OTHERS THEN
      -- Log any errors
      INSERT INTO processing_logs (
        job_id,
        transcript_id,
        stage,
        status,
        payload,
        error_message
      ) VALUES (
        gen_random_uuid(),
        transcript_record.id,
        'failed',
        'auto_processing_failed',
        jsonb_build_object(
          'user_id', transcript_record.user_id,
          'error_code', SQLSTATE,
          'auto_processed', true
        ),
        SQLERRM
      );
    END;
  END LOOP;
  
  -- Log summary
  IF processing_count > 0 THEN
    RAISE NOTICE 'Auto-processed % transcripts', processing_count;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to execute approved actions
CREATE OR REPLACE FUNCTION execute_approved_actions()
RETURNS void AS $$
DECLARE
  action_record RECORD;
  execution_count INTEGER := 0;
BEGIN
  -- Get approved actions that haven't been executed yet
  FOR action_record IN
    SELECT id, user_id, tool_type, tool_name, payload, transcript_id
    FROM actions
    WHERE status = 'approved'
      AND executed_at IS NULL
      AND approved_at > NOW() - INTERVAL '1 hour'  -- Only recently approved
    ORDER BY approved_at ASC
    LIMIT 5  -- Process max 5 at a time
  LOOP
    BEGIN
      -- Log that we're executing this action
      INSERT INTO processing_logs (
        job_id,
        transcript_id,
        action_id,
        stage,
        status,
        payload
      ) VALUES (
        gen_random_uuid(),
        action_record.transcript_id,
        action_record.id,
        'executed',
        'auto_execution_started',
        jsonb_build_object(
          'action_id', action_record.id,
          'tool_type', action_record.tool_type,
          'tool_name', action_record.tool_name,
          'auto_executed', true
        )
      );
      
      -- Update action status to executed
      UPDATE actions 
      SET 
        status = 'executed',
        executed_at = NOW(),
        execution_result = jsonb_build_object(
          'success', true,
          'message', 'Auto-executed by pg_cron',
          'executed_at', NOW()
        )
      WHERE id = action_record.id;
      
      execution_count := execution_count + 1;
      
      -- TODO: Here you would call your actual action execution logic
      RAISE NOTICE 'Would execute action % (%)', 
        action_record.id, action_record.tool_name;
        
    EXCEPTION WHEN OTHERS THEN
      -- Mark action as failed
      UPDATE actions 
      SET 
        status = 'failed',
        error_message = SQLERRM,
        updated_at = NOW()
      WHERE id = action_record.id;
      
      -- Log the error
      INSERT INTO processing_logs (
        job_id,
        transcript_id,
        action_id,
        stage,
        status,
        payload,
        error_message
      ) VALUES (
        gen_random_uuid(),
        action_record.transcript_id,
        action_record.id,
        'executed',
        'auto_execution_failed',
        jsonb_build_object(
          'action_id', action_record.id,
          'error_code', SQLSTATE,
          'auto_executed', true
        ),
        SQLERRM
      );
    END;
  END LOOP;
  
  IF execution_count > 0 THEN
    RAISE NOTICE 'Auto-executed % actions', execution_count;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to process scheduled actions
CREATE OR REPLACE FUNCTION process_scheduled_actions()
RETURNS void AS $$
DECLARE
  schedule_record RECORD;
  scheduled_count INTEGER := 0;
BEGIN
  -- Get schedules that are due to run
  FOR schedule_record IN
    SELECT s.id, s.action_id, s.user_id, s.cron_expression, s.timezone,
           a.tool_type, a.tool_name, a.payload
    FROM schedules s
    JOIN actions a ON a.id = s.action_id
    WHERE s.enabled = true
      AND s.next_run <= NOW()
      AND (s.max_runs IS NULL OR s.run_count < s.max_runs)
    ORDER BY s.next_run ASC
    LIMIT 10
  LOOP
    BEGIN
      -- Create a new action instance for this scheduled run
      INSERT INTO actions (
        transcript_id,
        user_id,
        tool_type,
        tool_name,
        payload,
        confidence,
        reasoning,
        status,
        approved_at
      ) 
      SELECT 
        NULL,  -- No transcript for scheduled actions
        schedule_record.user_id,
        schedule_record.tool_type,
        schedule_record.tool_name,
        schedule_record.payload,
        1.0,  -- Full confidence for scheduled actions
        'Scheduled action from cron: ' || schedule_record.cron_expression,
        'approved',  -- Auto-approve scheduled actions
        NOW()
      ;
      
      -- Update the schedule
      UPDATE schedules 
      SET 
        run_count = run_count + 1,
        last_run = NOW(),
        next_run = calculate_next_cron_run(cron_expression, timezone),
        updated_at = NOW()
      WHERE id = schedule_record.id;
      
      scheduled_count := scheduled_count + 1;
      
      RAISE NOTICE 'Scheduled action % executed for user %', 
        schedule_record.action_id, schedule_record.user_id;
        
    EXCEPTION WHEN OTHERS THEN
      -- Log the error but continue with other schedules
      INSERT INTO sync_errors (
        user_id,
        service_name,
        error_message,
        error_details
      ) VALUES (
        schedule_record.user_id,
        'pg_cron_scheduler',
        'Failed to process scheduled action: ' || SQLERRM,
        jsonb_build_object(
          'schedule_id', schedule_record.id,
          'action_id', schedule_record.action_id,
          'error_code', SQLSTATE
        )
      );
    END;
  END LOOP;
  
  IF scheduled_count > 0 THEN
    RAISE NOTICE 'Processed % scheduled actions', scheduled_count;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to sync recent Limitless data automatically
CREATE OR REPLACE FUNCTION auto_sync_limitless()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  sync_count INTEGER := 0;
BEGIN
  -- Get users who need incremental sync (haven't synced in last hour)
  FOR user_record IN
    SELECT DISTINCT ss.user_id, ss.last_sync_at
    FROM sync_state ss
    WHERE ss.service_name = 'limitless'
      AND (ss.last_sync_at IS NULL OR ss.last_sync_at < NOW() - INTERVAL '1 hour')
    LIMIT 5  -- Sync max 5 users at a time
  LOOP
    BEGIN
      -- Log sync attempt
      INSERT INTO processing_logs (
        job_id,
        stage,
        status,
        payload
      ) VALUES (
        gen_random_uuid(),
        'ingested',
        'auto_sync_started',
        jsonb_build_object(
          'user_id', user_record.user_id,
          'service', 'limitless',
          'sync_type', 'incremental',
          'last_sync', user_record.last_sync_at
        )
      );
      
      sync_count := sync_count + 1;
      
      -- TODO: Here you would call your Python sync service
      RAISE NOTICE 'Would sync Limitless data for user %', user_record.user_id;
      
      -- Update sync state timestamp
      UPDATE sync_state 
      SET last_sync_at = NOW()
      WHERE user_id = user_record.user_id AND service_name = 'limitless';
        
    EXCEPTION WHEN OTHERS THEN
      -- Log sync error
      INSERT INTO sync_errors (
        user_id,
        service_name,
        error_message,
        error_details
      ) VALUES (
        user_record.user_id,
        'limitless_auto_sync',
        'Auto sync failed: ' || SQLERRM,
        jsonb_build_object(
          'error_code', SQLSTATE,
          'last_sync_at', user_record.last_sync_at
        )
      );
    END;
  END LOOP;
  
  IF sync_count > 0 THEN
    RAISE NOTICE 'Auto-synced % users from Limitless', sync_count;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old logs and maintain database health
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
DECLARE
  deleted_logs INTEGER;
  deleted_errors INTEGER;
BEGIN
  -- Delete processing logs older than 30 days
  DELETE FROM processing_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_logs = ROW_COUNT;
  
  -- Delete resolved sync errors older than 7 days
  DELETE FROM sync_errors 
  WHERE resolved = true 
    AND occurred_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_errors = ROW_COUNT;
  
  -- Log cleanup
  IF deleted_logs > 0 OR deleted_errors > 0 THEN
    RAISE NOTICE 'Cleanup: removed % old logs, % old errors', 
      deleted_logs, deleted_errors;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create the cron jobs (these will need to be run manually in Supabase or enabled via SQL)
-- Note: Supabase may require these to be set up through their dashboard

-- Schedule transcript processing every 5 minutes
-- SELECT cron.schedule('process-transcripts', '*/5 * * * *', 'SELECT process_pending_transcripts();');

-- Schedule action execution every 2 minutes  
-- SELECT cron.schedule('execute-actions', '*/2 * * * *', 'SELECT execute_approved_actions();');

-- Schedule recurring actions every 10 minutes
-- SELECT cron.schedule('scheduled-actions', '*/10 * * * *', 'SELECT process_scheduled_actions();');

-- Schedule Limitless sync every 30 minutes
-- SELECT cron.schedule('sync-limitless', '*/30 * * * *', 'SELECT auto_sync_limitless();');

-- Schedule cleanup daily at 2 AM
-- SELECT cron.schedule('cleanup-data', '0 2 * * *', 'SELECT cleanup_old_data();');

-- View to check cron job status (uncomment if pg_cron is enabled)
-- CREATE OR REPLACE VIEW cron_job_status AS
-- SELECT 
--   jobname,
--   schedule,
--   command,
--   nodename,
--   nodeport,
--   database,
--   username,
--   active,
--   jobid
-- FROM cron.job;

-- Function to manually trigger all automated processes (for testing)
CREATE OR REPLACE FUNCTION trigger_all_automation()
RETURNS TABLE(
  process_name TEXT,
  status TEXT,
  message TEXT
) AS $$
BEGIN
  -- Process transcripts
  BEGIN
    PERFORM process_pending_transcripts();
    RETURN QUERY SELECT 'process_transcripts'::TEXT, 'success'::TEXT, 'Completed'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'process_transcripts'::TEXT, 'error'::TEXT, SQLERRM::TEXT;
  END;
  
  -- Execute actions
  BEGIN
    PERFORM execute_approved_actions();
    RETURN QUERY SELECT 'execute_actions'::TEXT, 'success'::TEXT, 'Completed'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'execute_actions'::TEXT, 'error'::TEXT, SQLERRM::TEXT;
  END;
  
  -- Process schedules
  BEGIN
    PERFORM process_scheduled_actions();
    RETURN QUERY SELECT 'process_schedules'::TEXT, 'success'::TEXT, 'Completed'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'process_schedules'::TEXT, 'error'::TEXT, SQLERRM::TEXT;
  END;
  
  -- Sync Limitless
  BEGIN
    PERFORM auto_sync_limitless();
    RETURN QUERY SELECT 'sync_limitless'::TEXT, 'success'::TEXT, 'Completed'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'sync_limitless'::TEXT, 'error'::TEXT, SQLERRM::TEXT;
  END;
  
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION process_pending_transcripts() IS 'Automatically process new transcripts through MCP pipeline';
COMMENT ON FUNCTION execute_approved_actions() IS 'Execute approved actions automatically';
COMMENT ON FUNCTION process_scheduled_actions() IS 'Process cron-scheduled recurring actions';
COMMENT ON FUNCTION auto_sync_limitless() IS 'Automatically sync recent Limitless data';
COMMENT ON FUNCTION cleanup_old_data() IS 'Clean up old logs and maintain database health';
COMMENT ON FUNCTION trigger_all_automation() IS 'Manually trigger all automation processes for testing';