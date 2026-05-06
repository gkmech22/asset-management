
-- Documents metadata table
CREATE TABLE public.asset_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type text NOT NULL CHECK (owner_type IN ('asset','order')),
  owner_id text NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  mime_type text,
  file_size bigint,
  doc_month text,
  uploaded_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_asset_documents_owner ON public.asset_documents(owner_type, owner_id);

ALTER TABLE public.asset_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_view_documents" ON public.asset_documents
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_documents" ON public.asset_documents
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_delete_documents" ON public.asset_documents
  FOR DELETE TO authenticated USING (true);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('asset-documents', 'asset-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "auth_read_asset_docs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'asset-documents');

CREATE POLICY "auth_upload_asset_docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'asset-documents');

CREATE POLICY "auth_delete_asset_docs"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'asset-documents');
