
-- Rate limiting table (sliding window via timestamps array)
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS rate_limits_identifier_idx ON public.rate_limits(identifier);
CREATE INDEX IF NOT EXISTS rate_limits_window_start_idx ON public.rate_limits(window_start);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role accesses this table; no policies needed for clients.

-- Atomic check-and-increment function (sliding 60s window, configurable max)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _identifier TEXT,
  _max_requests INTEGER DEFAULT 125,
  _window_seconds INTEGER DEFAULT 60
)
RETURNS TABLE(allowed BOOLEAN, current_count INTEGER, retry_after INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_row RECORD;
  v_window_start TIMESTAMPTZ;
BEGIN
  v_window_start := now() - (_window_seconds || ' seconds')::INTERVAL;

  -- Clean up very old entries opportunistically (older than 1 hour)
  DELETE FROM public.rate_limits WHERE updated_at < now() - INTERVAL '1 hour';

  SELECT * INTO v_row
  FROM public.rate_limits
  WHERE identifier = _identifier
  FOR UPDATE;

  IF v_row IS NULL THEN
    INSERT INTO public.rate_limits (identifier, request_count, window_start, updated_at)
    VALUES (_identifier, 1, now(), now());
    RETURN QUERY SELECT true, 1, 0;
    RETURN;
  END IF;

  -- If window expired, reset
  IF v_row.window_start < v_window_start THEN
    UPDATE public.rate_limits
    SET request_count = 1, window_start = now(), updated_at = now()
    WHERE identifier = _identifier;
    RETURN QUERY SELECT true, 1, 0;
    RETURN;
  END IF;

  -- Within window: check limit
  IF v_row.request_count >= _max_requests THEN
    RETURN QUERY SELECT 
      false, 
      v_row.request_count, 
      GREATEST(1, _window_seconds - EXTRACT(EPOCH FROM (now() - v_row.window_start))::INTEGER);
    RETURN;
  END IF;

  -- Increment
  UPDATE public.rate_limits
  SET request_count = request_count + 1, updated_at = now()
  WHERE identifier = _identifier;

  RETURN QUERY SELECT true, v_row.request_count + 1, 0;
END;
$$;
