-- Create assets table
CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  brand TEXT NOT NULL,
  configuration TEXT,
  serial_number TEXT NOT NULL UNIQUE,
  assigned_to TEXT,
  employee_id TEXT,
  status TEXT NOT NULL DEFAULT 'Available',
  location TEXT NOT NULL,
  assigned_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your auth requirements)
CREATE POLICY "Assets are viewable by everyone" 
ON public.assets 
FOR SELECT 
USING (true);

CREATE POLICY "Assets can be inserted by everyone" 
ON public.assets 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Assets can be updated by everyone" 
ON public.assets 
FOR UPDATE 
USING (true);

CREATE POLICY "Assets can be deleted by everyone" 
ON public.assets 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_assets_updated_at
BEFORE UPDATE ON public.assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.assets (asset_id, name, type, brand, configuration, serial_number, assigned_to, employee_id, status, location, assigned_date) VALUES
('AST-001', 'MacBook Pro 16"', 'Laptop', 'Apple', '16GB RAM, 512GB SSD', 'MBP16-2023-001', 'John Doe', 'EMP001', 'Assigned', 'Mumbai Office', '2024-01-15'),
('AST-002', 'ThinkPad X1', 'Laptop', 'Lenovo', '32GB RAM, 1TB SSD', 'TPX1-2023-002', NULL, NULL, 'Available', 'Hyderabad WH', NULL),
('AST-003', 'iPad Pro', 'Tablet', 'Apple', '256GB, Wi-Fi + Cellular', 'IPD-2023-003', 'Jane Smith', 'EMP002', 'Assigned', 'Bangalore Office', '2024-02-01'),
('AST-004', 'Surface Pro', 'Tablet', 'Microsoft', '16GB RAM, 512GB SSD', 'SP-2023-004', NULL, NULL, 'Available', 'Ghaziabad WH', NULL),
('AST-005', 'iPhone 15 Pro', 'Phone', 'Apple', '256GB, 5G', 'IP15-2023-005', 'Mike Johnson', 'EMP003', 'Assigned', 'Mumbai Office', '2024-01-20');