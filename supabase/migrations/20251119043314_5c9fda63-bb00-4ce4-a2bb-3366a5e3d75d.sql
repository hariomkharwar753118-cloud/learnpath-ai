-- Create transcripts table for caching YouTube transcripts
CREATE TABLE IF NOT EXISTS public.transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id text NOT NULL UNIQUE,
  video_url text NOT NULL,
  transcript jsonb NOT NULL,
  source text NOT NULL DEFAULT 'rapidapi',
  fetched_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;

-- Allow users to view all cached transcripts (since they're public YouTube videos)
CREATE POLICY "Anyone can view transcripts"
ON public.transcripts
FOR SELECT
TO authenticated
USING (true);

-- Only authenticated users can insert transcripts
CREATE POLICY "Authenticated users can insert transcripts"
ON public.transcripts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_transcripts_video_id ON public.transcripts(video_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_expires_at ON public.transcripts(expires_at);