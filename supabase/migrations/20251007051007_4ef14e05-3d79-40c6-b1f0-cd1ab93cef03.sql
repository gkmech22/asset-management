-- Create pending_requests table for approval workflow
CREATE TABLE public.pending_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_type TEXT NOT NULL CHECK (request_type IN ('assign', 'return')),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  requested_by TEXT NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  cancelled_by TEXT,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- For assign requests
  assign_to TEXT,
  employee_id TEXT,
  employee_email TEXT,
  
  -- For return requests
  return_remarks TEXT,
  return_location TEXT,
  return_status TEXT,
  asset_condition TEXT,
  received_by TEXT,
  configuration TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pending_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view pending requests"
  ON public.pending_requests
  FOR SELECT
  USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can insert pending requests"
  ON public.pending_requests
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can update pending requests"
  ON public.pending_requests
  FOR UPDATE
  USING (auth.role() = 'authenticated'::text);

-- Create index for faster queries
CREATE INDEX idx_pending_requests_status ON public.pending_requests(status);
CREATE INDEX idx_pending_requests_asset_id ON public.pending_requests(asset_id);
CREATE INDEX idx_pending_requests_requested_by ON public.pending_requests(requested_by);